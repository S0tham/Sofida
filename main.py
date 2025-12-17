import os
import uvicorn
import json
import uuid
import re 
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path 
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# We hebben alleen ElevenLabs nodig!
from elevenlabs.client import ElevenLabs 

# 1. Setup
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("PORTKEY_API_KEY")
eleven_key = os.getenv("ELEVENLABS_API_KEY")

if not api_key: api_key = "ontbrekend"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

headers = {
    "x-portkey-api-key": api_key,
    "x-portkey-provider": "openai",
    "Content-Type": "application/json"
}

# 2. AI Configuraties
llm = ChatOpenAI(
    api_key="dummy",
    base_url="https://api.portkey.ai/v1",
    model="gpt-5.1", 
    default_headers=headers
)

# ElevenLabs Client (voor Scribe ÉN Spreken)
eleven_client = ElevenLabs(api_key=eleven_key)

sessions = {}

# --- TYPES ---
class SessionConfig(BaseModel):
    topic: str
    difficulty: str = "medium"
    skill: str = "general"
    tutor_id: str = "jan"

class UserMessage(BaseModel):
    text: str

class ThemeUpdate(BaseModel):
    theme: str

class ExerciseRequest(BaseModel):
    theme: str

class SpeakRequest(BaseModel):
    text: str
    tutor_id: str

# --- HULPFUNCTIES ---
def extract_and_parse_json(text):
    try: return json.loads(text)
    except: pass
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match: return json.loads(match.group(0))
    except: pass
    return None

def normalize_exercise_data(data):
    if not data: return None
    normalized = {k.lower(): v for k, v in data.items()}
    return {
        "question": normalized.get("question", "Geen vraag ontvangen"),
        "options": normalized.get("options", ["Fout bij laden"]),
        "correct_answer": normalized.get("correct_answer") or normalized.get("answer") or "",
        "explanation": normalized.get("explanation", "")
    }

def create_exercise_json(history, topic, theme):
    prompt = f"""
    CONTEXT: De student is bezig met {topic}. THEMA: {theme}.
    TAAK: Genereer 1 multiple choice vraag.
    JSON FORMAT: {{ "question": "...", "options": ["..."], "correct_answer": "...", "explanation": "..." }}
    """
    messages = history[-5:] + [HumanMessage(content=prompt)]
    try:
        response = llm.invoke(messages)
        data = extract_and_parse_json(response.content)
        return normalize_exercise_data(data)
    except: return None

# --- ENDPOINTS ---

@app.post("/start_session")
async def start_session(config: SessionConfig):
    personas = {
        "jan": { "name": "Meester Jan", "role": "Geduldig", "style": "Rustig" },
        "sara": { "name": "Coach Sara", "role": "Direct", "style": "Energiek" }
    }
    tutor = personas.get(config.tutor_id, personas["jan"])
    
    system_prompt = f"Je bent {tutor['name']}. {tutor['role']}. Als gevraagd om oefening, zeg ALLEEN: [GENERATE_EXERCISE]"
    session_id = str(uuid.uuid4())
    sessions[session_id] = { "history": [SystemMessage(content=system_prompt)], "tutor": tutor, "config": config, "active_theme": "Algemeen" }
    
    return { "session_id": session_id, "state": { "tutor": tutor, "chat_history": [], "theme": "Algemeen" } }

@app.post("/chat/{session_id}")
async def chat(session_id: str, message: UserMessage):
    if session_id not in sessions: raise HTTPException(404, "Sessie niet gevonden")
    session = sessions[session_id]
    session["history"].append(HumanMessage(content=message.text))
    
    try:
        response = llm.invoke(session["history"])
        ai_text = response.content
        exercise_data = None
        
        if "[GENERATE_EXERCISE]" in ai_text:
            ai_text = ai_text.replace("[GENERATE_EXERCISE]", "").strip() or "Hier is een oefening!"
            exercise_data = create_exercise_json(session["history"], session["config"].topic, session["active_theme"])
        
        session["history"].append(AIMessage(content=ai_text))
        
        frontend_history = []
        for msg in session["history"]:
            if isinstance(msg, HumanMessage): frontend_history.append({"role": "user", "text": msg.content})
            elif isinstance(msg, AIMessage): frontend_history.append({"role": "tutor", "text": msg.content})

        if exercise_data: frontend_history.append({"role": "exercise", "exercise": exercise_data})
        
        return { "state": { "tutor": session["tutor"], "chat_history": frontend_history, "theme": session["active_theme"] } }
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/generate_exercise/{session_id}")
async def generate_exercise_endpoint(session_id: str, req: ExerciseRequest):
    if session_id not in sessions: raise HTTPException(404)
    session = sessions[session_id]
    theme = req.theme if req.theme else session["active_theme"]
    data = create_exercise_json(session["history"], session["config"].topic, theme)
    if not data: raise HTTPException(500, "Mislukt")
    return data

@app.post("/set_theme/{session_id}")
async def set_theme(session_id: str, update: ThemeUpdate):
    if session_id not in sessions: raise HTTPException(404)
    sessions[session_id]["active_theme"] = update.theme
    return {"status": "ok"}

# --- ELEVENLABS SCRIBE (LUISTEREN) ---
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Gebruikt ElevenLabs Scribe om audio naar tekst te vertalen"""
    try:
        # We lezen het bestand in het geheugen
        audio_content = await file.read()
        
        # We sturen de bytes direct naar ElevenLabs Scribe
        transcription = eleven_client.speech_to_text.convert(
            file=audio_content,
            model_id="scribe_v1"  # Het nieuwe Scribe model
        )
        
        # Scribe geeft direct de tekst terug in de response
        return {"text": transcription.text}
    except Exception as e:
        print(f"Scribe Error: {e}")
        raise HTTPException(500, str(e))

# --- ELEVENLABS TTS (SPREKEN) ---
@app.post("/speak")
async def speak_text(req: SpeakRequest):
    print(f"🔊 Audio verzoek voor: {req.tutor_id}. Tekst: {req.text[:20]}...")
    try:
        voice_id = "ErXwobaYiN019PkySvjV" 
        if req.tutor_id == "sara":
            voice_id = "EXAVITQu4vr4xnSDxMaL"
            
        print(f"🎤 Verbinding maken met ElevenLabs met key: {eleven_key[:5]}... en voice: {voice_id}")
        
        audio_stream = eleven_client.text_to_speech.convert(
            voice_id=voice_id,
            output_format="mp3_44100_128",
            text=req.text,
            model_id="eleven_multilingual_v2"
        )
        
        print("✅ Audio stream ontvangen van ElevenLabs!")
        
        def iterfile():
            yield from audio_stream

        return StreamingResponse(iterfile(), media_type="audio/mpeg")
    except Exception as e:
        print(f"❌ ElevenLabs TTS FOUT: {e}")
        # Dit print de volledige foutmelding, dat helpt ons enorm!
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
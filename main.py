import os
import uvicorn
import json
import uuid
import re 
import random # <--- NIEUW: Nodig voor de 50/50 kans
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path 
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
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

llm = ChatOpenAI(
    api_key="dummy",
    base_url="https://api.portkey.ai/v1",
    model="gpt-5.1", 
    default_headers=headers
)

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
    skill: str = "general" 

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

def normalize_exercise_data(data, skill_type):
    if not data: return None
    normalized = {k.lower(): v for k, v in data.items()}
    
    ex_type = normalized.get("type", "multiple_choice")
    
    # Forceer het type als de AI het vergeet, maar respecteer de random keuze van de prompt
    if skill_type == "writing": 
        ex_type = "writing"
    elif skill_type == "grammar": 
        # Hier checken we wat de AI heeft bedacht (gap_fill of mc)
        if "gap_fill" in ex_type or "___" in normalized.get("question", ""):
            ex_type = "gap_fill"
        else:
            ex_type = "multiple_choice"

    return {
        "type": ex_type,
        "question": normalized.get("question", "Geen vraag ontvangen"),
        "options": normalized.get("options", []),
        "correct_answer": normalized.get("correct_answer") or normalized.get("answer") or "",
        "explanation": normalized.get("explanation", "")
    }

def create_exercise_json(history, topic, specific_topic, skill):
    prompt_instruction = ""
    
    if skill == "writing":
        prompt_instruction = """
        TYPE: Schrijfopdracht (Writing).
        TAAK: Geef de student een korte, creatieve schrijfopdracht (bijv. 'Schrijf een korte email aan...').
        JSON FORMAT: { "type": "writing", "question": "De opdracht...", "options": [], "explanation": "Waar de student op moet letten." }
        """
    elif skill == "grammar":
        # 50/50 KANS LOGICA
        if random.choice([True, False]):
            prompt_instruction = """
            TYPE: Gap Fill (Grammatica).
            TAAK: Maak een zin die past bij het onderwerp, met 1 ontbrekend woord (___) dat de grammatica test.
            JSON FORMAT: { "type": "gap_fill", "question": "Zin met ___ erin", "options": ["optie A", "optie B", "optie C"], "correct_answer": "optie A", "explanation": "Korte grammaticale uitleg." }
            """
        else:
            prompt_instruction = """
            TYPE: Multiple Choice (Grammatica).
            TAAK: Stel een vraag over een grammaticaregel (bijv. 'Welke zin is correct?' of 'Welke tijd is dit?').
            JSON FORMAT: { "type": "multiple_choice", "question": "De grammaticavraag...", "options": ["Optie A", "Optie B", "Optie C"], "correct_answer": "Optie A", "explanation": "Korte grammaticale uitleg." }
            """
    elif skill == "reading":
        prompt_instruction = """
        TYPE: Begrijpend Lezen.
        TAAK: Schrijf een zéér korte tekst (max 3 zinnen) en stel er een vraag over.
        JSON FORMAT: { "type": "multiple_choice", "question": "Tekst: ... Vraag: ...", "options": ["A", "B", "C"], "correct_answer": "A", "explanation": "Uitleg." }
        """
    else: # General/Vocabulary
        prompt_instruction = """
        TYPE: Multiple Choice (Woordenschat).
        JSON FORMAT: { "type": "multiple_choice", "question": "Vraag...", "options": ["A", "B", "C"], "correct_answer": "A", "explanation": "Uitleg." }
        """

    prompt = f"""
    VAK: {topic}
    ONDERWERP: {specific_topic}
    SKILL: {skill}
    {prompt_instruction}
    
    BELANGRIJK: Geef ALLEEN de ruwe JSON code terug.
    """
    
    messages = history[-5:] + [HumanMessage(content=prompt)]
    try:
        response = llm.invoke(messages)
        data = extract_and_parse_json(response.content)
        return normalize_exercise_data(data, skill)
    except: return None

# --- ENDPOINTS ---
@app.post("/start_session")
async def start_session(config: SessionConfig):
    personas = {
        "jan": { "name": "Meester Jan", "role": "Geduldig", "style": "Rustig" },
        "sara": { "name": "Coach Sara", "role": "Direct", "style": "Energiek" }
    }
    tutor = personas.get(config.tutor_id, personas["jan"])
    
    # AANGEPAST: Instructie voor max. 150 woorden toegevoegd
    system_prompt = f"""
    Je bent {tutor['name']}. {tutor['role']}. Jouw stijl is {tutor['style']}.
    
    BELANGRIJKE REGELS:
    1. Houd je normale antwoorden en uitleg beknopt (maximaal 150 woorden). Probeer 'to the point' te blijven.
    2. Als de gebruiker vraagt om een oefening, zeg dan ALLEEN: [GENERATE_EXERCISE]
    """
    
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
            exercise_data = create_exercise_json(session["history"], session["config"].topic, session["active_theme"], "general")
        
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
    
    topic_to_use = req.theme if req.theme else session["active_theme"]
    skill_to_use = req.skill if req.skill else "general"
    
    data = create_exercise_json(session["history"], session["config"].topic, topic_to_use, skill_to_use)
    if not data: raise HTTPException(500, "Mislukt")
    return data

@app.post("/set_theme/{session_id}")
async def set_theme(session_id: str, update: ThemeUpdate):
    if session_id not in sessions: raise HTTPException(404)
    sessions[session_id]["active_theme"] = update.theme
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        content = await file.read()
        transcription = eleven_client.speech_to_text.convert(file=content, model_id="scribe_v1")
        return {"text": transcription.text}
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/speak")
async def speak_text(req: SpeakRequest):
    try:
        voice_id = "ErXwobaYiN019PkySvjV" if req.tutor_id == "jan" else "EXAVITQu4vr4xnSDxMaL"
        audio_stream = eleven_client.text_to_speech.convert(voice_id=voice_id, output_format="mp3_44100_128", text=req.text, model_id="eleven_multilingual_v2")
        def iterfile(): yield from audio_stream
        return StreamingResponse(iterfile(), media_type="audio/mpeg")
    except Exception as e: raise HTTPException(500, str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
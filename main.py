import os
import uvicorn
import json
import uuid
import re 
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path 
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# 1. Setup
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("PORTKEY_API_KEY")
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

sessions = {}

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

# --- HULPFUNCTIES ---

def extract_and_parse_json(text):
    """Haalt JSON uit tekst, zelfs met markdown eromheen."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception:
        pass
    return None

def normalize_exercise_data(data):
    """
    FIX: Zorgt dat keys altijd lowercase zijn (Question -> question).
    Dit voorkomt dat de frontend crasht of niks laat zien.
    """
    if not data: return None
    
    # Maak alle keys lowercase
    normalized = {k.lower(): v for k, v in data.items()}
    
    # Check of we alles hebben, zo niet, vul aan
    return {
        "question": normalized.get("question", "Geen vraag ontvangen"),
        "options": normalized.get("options", ["Fout bij laden"]),
        "correct_answer": normalized.get("correct_answer") or normalized.get("answer") or normalized.get("correct") or "",
        "explanation": normalized.get("explanation", "")
    }

def create_exercise_json(history, topic, theme):
    prompt = f"""
    CONTEXT: De student is bezig met {topic}.
    THEMA: {theme}
    TAAK: Genereer 1 multiple choice vraag.
    
    BELANGRIJK: Geef ALLEEN de ruwe JSON code terug.
    
    JSON FORMAT:
    {{
      "question": "De vraagstelling...",
      "options": ["A) ...", "B) ..."],
      "correct_answer": "A) ...",
      "explanation": "..."
    }}
    """
    messages = history[-5:] + [HumanMessage(content=prompt)]
    
    try:
        print(f"🤖 Oefening genereren over: {theme}...")
        response = llm.invoke(messages)
        raw_content = response.content
        
        data = extract_and_parse_json(raw_content)
        
        # HIER REPAREREN WE DE DATA VOORDAT DEZE NAAR FRONTEND GAAT
        final_data = normalize_exercise_data(data)
        
        if not final_data:
            print(f"❌ JSON PARSE FOUT. Ruwe AI tekst was:\n{raw_content}")
            raise ValueError("Geen geldige JSON gevonden")
            
        print("✅ Oefening succesvol gegenereerd en genormaliseerd!")
        return final_data
        
    except Exception as e:
        print(f"❌ FATALE FOUT bij genereren: {e}")
        return None

# --- ENDPOINTS ---

@app.post("/start_session")
async def start_session(config: SessionConfig):
    personas = {
        "jan": {
            "name": "Meester Jan",
            "role": "Geduldig en aanmoedigend.",
            "style": "Legt rustig uit."
        },
        "sara": {
            "name": "Coach Sara",
            "role": "Direct en resultaatgericht.",
            "style": "Daagt uit en houdt tempo."
        }
    }
    tutor = personas.get(config.tutor_id, personas["jan"])
    
    system_prompt = f"""
    Je bent {tutor['name']}. {tutor['role']}
    Vak: {config.topic}.
    
    REGEL VOOR OEFENINGEN:
    Als de leerling om een oefening vraagt, typ NOOIT zelf een vraag.
    Zeg in plaats daarvan ALLEEN: [GENERATE_EXERCISE]
    """

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "history": [SystemMessage(content=system_prompt)],
        "tutor": tutor,
        "config": config,
        "active_theme": "Algemeen"
    }
    
    return {
        "session_id": session_id,
        "state": {
            "tutor": tutor,
            "chat_history": [],
            "theme": "Algemeen"
        }
    }

@app.post("/set_theme/{session_id}")
async def set_theme(session_id: str, update: ThemeUpdate):
    if session_id not in sessions: raise HTTPException(404, "Sessie niet gevonden")
    sessions[session_id]["active_theme"] = update.theme
    return {"status": "ok", "theme": update.theme}

@app.post("/generate_exercise/{session_id}")
async def generate_exercise_endpoint(session_id: str, req: ExerciseRequest):
    if session_id not in sessions: raise HTTPException(404, "Sessie niet gevonden")
    session = sessions[session_id]
    
    theme_to_use = req.theme if req.theme else session["active_theme"]
    
    exercise_data = create_exercise_json(
        session["history"], 
        session["config"].topic, 
        theme_to_use
    )
    
    if not exercise_data:
        raise HTTPException(500, "De AI gaf geen geldige oefening terug.")
        
    return exercise_data

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
            ai_text = ai_text.replace("[GENERATE_EXERCISE]", "").strip()
            if not ai_text: ai_text = "Hier is een oefening voor je!"
            
            exercise_data = create_exercise_json(
                session["history"], 
                session["config"].topic, 
                session["active_theme"]
            )
        
        session["history"].append(AIMessage(content=ai_text))
        
        frontend_history = []
        for msg in session["history"]:
            if isinstance(msg, HumanMessage):
                frontend_history.append({"role": "user", "text": msg.content})
            elif isinstance(msg, AIMessage):
                frontend_history.append({"role": "tutor", "text": msg.content})

        if exercise_data:
            # We sturen de genormaliseerde data
            frontend_history.append({
                "role": "exercise", 
                "exercise": exercise_data
            })
        
        return {
            "state": {
                "tutor": session["tutor"],
                "chat_history": frontend_history,
                "theme": session["active_theme"]
            }
        }
    except Exception as e:
        print(f"❌ FOUT: {e}")
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
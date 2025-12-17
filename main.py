import os
import uvicorn
import json
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

# CORS - "Alles mag" (voor ontwikkeling)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Portkey configuratie
headers = {
    "x-portkey-api-key": api_key,
    "x-portkey-provider": "openai",
    "Content-Type": "application/json"
}

llm = ChatOpenAI(
    api_key="dummy",
    base_url="https://api.portkey.ai/v1",
    model="gpt-4o", # Zorg dat je een slim model gebruikt voor JSON generatie
    default_headers=headers
)

sessions = {}

# --- DATAMODELLEN ---
class SessionConfig(BaseModel):
    topic: str
    difficulty: str = "medium"
    skill: str = "general"
    tutor_id: str = "jan" # Nieuw: we geven hier door wie we willen spreken

class UserMessage(BaseModel):
    text: str

class ExerciseRequest(BaseModel):
    theme: str # Het thema dat de leerling kiest (bv. "Voetbal")

# --- ENDPOINTS ---

@app.post("/start_session")
async def start_session(config: SessionConfig):
    # Definieer de persona's
    personas = {
        "jan": {
            "name": "Meester Jan",
            "role": "Een geduldige, vriendelijke leraar die veel aanmoedigt.",
            "style": "Gebruik eenvoudige taal, wees hulpvaardig en geef complimenten."
        },
        "sara": {
            "name": "Coach Sara",
            "role": "Een directe, energieke coach die focust op resultaat.",
            "style": "Wees kort, krachtig, professioneel en daag de student uit."
        }
    }
    
    # Kies de tutor op basis van de request, of fallback naar Jan
    tutor = personas.get(config.tutor_id, personas["jan"])
    
    system_prompt = f"""
    Je bent {tutor['name']}. {tutor['role']}
    Jouw stijl is: {tutor['style']}
    Het onderwerp is: {config.topic}.
    Niveau: {config.difficulty}.
    Reageer altijd in het Nederlands.
    """

    import uuid
    session_id = str(uuid.uuid4())
    
    sessions[session_id] = {
        "history": [SystemMessage(content=system_prompt)],
        "tutor": tutor,
        "config": config # We bewaren de config voor later
    }
    
    return {
        "session_id": session_id,
        "state": {
            "tutor": tutor,
            "chat_history": []
        }
    }

@app.post("/chat/{session_id}")
async def chat(session_id: str, message: UserMessage):
    if session_id not in sessions: raise HTTPException(404, "Sessie niet gevonden")
    session = sessions[session_id]
    
    session["history"].append(HumanMessage(content=message.text))
    
    try:
        response = llm.invoke(session["history"])
        session["history"].append(AIMessage(content=response.content))
        
        frontend_history = []
        for msg in session["history"]:
            if isinstance(msg, HumanMessage):
                frontend_history.append({"role": "user", "text": msg.content})
            elif isinstance(msg, AIMessage):
                frontend_history.append({"role": "tutor", "text": msg.content})
        
        return {"state": {"tutor": session["tutor"], "chat_history": frontend_history}}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/generate_exercise/{session_id}")
async def generate_exercise(session_id: str, req: ExerciseRequest):
    if session_id not in sessions: raise HTTPException(404, "Sessie niet gevonden")
    session = sessions[session_id]
    
    # We vragen de AI om een oefening te maken op basis van de chatgeschiedenis
    # We voegen een tijdelijke instructie toe (zonder die in de geschiedenis op te slaan)
    history_context = session["history"][-5:] # Pak de laatste 5 berichten voor context
    
    prompt = f"""
    Kijk naar de bovenstaande conversatie. De student wil oefenen.
    Onderwerp: {session['config'].topic}.
    Thema voor de vraag: {req.theme} (Gebruik dit thema in de vraagstelling!).
    
    Genereer 1 multiple choice vraag.
    Geef het antwoord in puur JSON formaat:
    {{
      "question": "De vraagstelling...",
      "options": ["A) optie 1", "B) optie 2", "C) optie 3", "D) optie 4"],
      "correct_answer": "A) optie 1",
      "explanation": "Uitleg waarom dit goed is."
    }}
    Geef ALLEEN de JSON terug, geen markdown opmaak.
    """
    
    messages = history_context + [HumanMessage(content=prompt)]
    
    try:
        response = llm.invoke(messages)
        content = response.content.replace("```json", "").replace("```", "").strip()
        exercise_data = json.loads(content)
        return exercise_data
    except Exception as e:
        print(f"Fout bij genereren: {e}")
        # Fallback oefening als JSON parsen mislukt
        return {
            "question": "Er ging iets mis met genereren. Probeer het nog eens.",
            "options": ["Probeer opnieuw"],
            "correct_answer": "Probeer opnieuw",
            "explanation": "De AI gaf geen geldig JSON formaat."
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
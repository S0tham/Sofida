import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path 

# --- IMPORTS ---
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# 1. Laad de sleutel uit .env (GEFORCEERD PAD)
# Dit zoekt het .env bestand in precies dezelfde map als dit script
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Controleer of de sleutel geladen is
api_key = os.getenv("PORTKEY_API_KEY")

if not api_key:
    # Als de key niet gevonden is, printen we een duidelijke fout en stoppen we niet direct,
    # maar de ChatOpenAI zal later wel klagen als we niks doen.
    print(f"❌ LET OP: Geen PORTKEY_API_KEY gevonden in: {env_path}")
    print("   Zorg dat je bestand '.env' heet (niet .env.txt) en in dezelfde map staat.")
    # We zetten een dummy waarde zodat de server wel kan starten (voor debuggen), 
    # maar chatten zal falen.
    api_key = "ontbrekend"
else:
    print(f"✅ API Key succesvol geladen: {api_key[:5]}...")

app = FastAPI()

# CORS instellingen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PORTKEY CONFIGURATIE ---
headers = {
    "x-portkey-api-key": api_key,
    "x-portkey-provider": "openai", 
    "Content-Type": "application/json"
}

# De verbinding met de AI
llm = ChatOpenAI(
    api_key="dummy", 
    base_url="https://api.portkey.ai/v1", 
    model="gpt-5.1",  # <--- HIER STAAT JE NIEUWE MODEL
    default_headers=headers
)

# Geheugen opslag
sessions = {}

# Datamodellen
class SessionConfig(BaseModel):
    topic: str
    difficulty: str = "medium"
    skill: str = "general"

class UserMessage(BaseModel):
    text: str

# --- ENDPOINTS ---

@app.post("/start_session/{tutor_id}")
async def start_session(tutor_id: str, config: SessionConfig):
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
    
    tutor = personas.get(tutor_id, personas["jan"])
    
    system_prompt = f"""
    Je bent {tutor['name']}. {tutor['role']}
    Jouw stijl is: {tutor['style']}
    Het onderwerp is: {config.topic}.
    Niveau: {config.difficulty}.
    Reageer altijd in het Nederlands, tenzij het vak Engels is.
    """

    import uuid
    session_id = str(uuid.uuid4())
    
    sessions[session_id] = {
        "history": [SystemMessage(content=system_prompt)],
        "tutor": tutor
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
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Sessie niet gevonden")
    
    session = sessions[session_id]
    
    # 1. Voeg bericht toe
    session["history"].append(HumanMessage(content=message.text))
    
    try:
        # 2. Stuur naar Portkey (gpt-5.1)
        response = llm.invoke(session["history"])
        ai_text = response.content
        
        # 3. Voeg antwoord toe
        session["history"].append(AIMessage(content=ai_text))
        
        frontend_history = []
        for msg in session["history"]:
            if isinstance(msg, HumanMessage):
                frontend_history.append({"role": "user", "text": msg.content})
            elif isinstance(msg, AIMessage):
                frontend_history.append({"role": "tutor", "text": msg.content})
        
        return {
            "state": {
                "tutor": session["tutor"],
                "chat_history": frontend_history
            }
        }
    except Exception as e:
        print(f"Portkey Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Fout: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
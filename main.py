# main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid

from tutor_personalities import TutorPersonaliteiten
from conversation_manager import (
    SessionState,
    ConversationConfig,
    ConversationManager,
    session_state_to_public,
)


app = FastAPI(title="AI Tutor Backend")

# CORS voor frontend (pas origins aan als je wilt)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================
#   In-memory sessiebeheer
# ==========================

SESSIONS: Dict[str, ConversationManager] = {}


def get_manager(session_id: str) -> ConversationManager:
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    return SESSIONS[session_id]


# ==========================
#   Pydantic modellen
# ==========================

class ConfigModel(BaseModel):
    topic: str = "Present Perfect"
    theme: str = "school"
    skill: str = "grammar"
    difficulty: str = "medium"


class CreateSessionRequest(BaseModel):
    tutor: str = "jan"   # "jan" of "sara"
    config: Optional[ConfigModel] = None


class CreateSessionResponse(BaseModel):
    session_id: str
    state: Dict[str, Any]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    state: Dict[str, Any]


class ExerciseResponse(BaseModel):
    exercise: Dict[str, Any]
    state: Dict[str, Any]


class AnswerRequest(BaseModel):
    answer: str


class AnswerResponse(BaseModel):
    check_result: Dict[str, Any]
    feedback: Dict[str, Any]
    summary_message: str
    state: Dict[str, Any]


class StateResponse(BaseModel):
    state: Dict[str, Any]


# ==========================
#   Routes
# ==========================

@app.post("/api/session", response_model=CreateSessionResponse)
def create_session(req: CreateSessionRequest):
    # kies tutor
    if req.tutor.lower() == "sara":
        tutor = TutorPersonaliteiten.coach_sara()
    else:
        tutor = TutorPersonaliteiten.meester_jan()

    cfg_data = req.config.dict() if req.config else {}
    cfg = ConversationConfig(**cfg_data)

    state = SessionState(tutor=tutor, config=cfg)
    manager = ConversationManager(state=state)

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = manager

    return CreateSessionResponse(
        session_id=session_id,
        state=session_state_to_public(state),
    )


@app.get("/api/session/{session_id}", response_model=StateResponse)
def get_session_state(session_id: str):
    manager = get_manager(session_id)
    return StateResponse(state=session_state_to_public(manager.state))


@app.post("/api/session/{session_id}/chat", response_model=ChatResponse)
def post_chat_message(session_id: str, req: ChatRequest):
    manager = get_manager(session_id)
    reply = manager.handle_user_chat(req.message)
    return ChatResponse(
        reply=reply,
        state=session_state_to_public(manager.state),
    )


@app.post("/api/session/{session_id}/exercise", response_model=ExerciseResponse)
def create_exercise(session_id: str):
    manager = get_manager(session_id)
    exercise = manager.request_new_exercise()
    return ExerciseResponse(
        exercise=exercise,
        state=session_state_to_public(manager.state),
    )


@app.post("/api/session/{session_id}/answer", response_model=AnswerResponse)
def submit_answer(session_id: str, req: AnswerRequest):
    manager = get_manager(session_id)

    try:
        result = manager.submit_answer(req.answer)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return AnswerResponse(
        check_result=result["check_result"],
        feedback=result["feedback"],
        summary_message=result["summary_message"],
        state=session_state_to_public(manager.state),
    )

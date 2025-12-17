# conversation_manager.py

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional
import textwrap

from tutor_personalities import (
    TutorPersonaliteiten,
    TutorPersoonlijkheid,
    BASE_TUTOR_RULES,
    call_ollama as llm_chat_call,
)
from exercise_generator import generate_exercise_with_llm
from answer_checker import check_answer
from feedback_generator import generate_feedback


# ================================================================
#  State-structuren
# ================================================================

@dataclass
class ChatTurn:
    role: str  # "user" of "tutor"
    text: str


@dataclass
class ExerciseState:
    exercise: Dict[str, Any]
    last_answer: Optional[str] = None
    last_check: Optional[Dict[str, Any]] = None
    last_feedback: Optional[Dict[str, Any]] = None


@dataclass
class ConversationConfig:
    topic: str = "Present Perfect"
    theme: str = "school"
    skill: str = "grammar"      # grammar / reading / writing
    difficulty: str = "medium"  # easy / medium / hard


@dataclass
class SessionState:
    tutor: TutorPersoonlijkheid
    history: List[ChatTurn] = field(default_factory=list)
    exercises: Dict[str, ExerciseState] = field(default_factory=dict)
    current_exercise_id: Optional[str] = None
    config: ConversationConfig = field(default_factory=ConversationConfig)


# helper om JSON-achtige dict van state te maken
def session_state_to_public(state: SessionState) -> Dict[str, Any]:
    current_exercise: Optional[Dict[str, Any]] = None
    last_feedback: Optional[Dict[str, Any]] = None

    if state.current_exercise_id and state.current_exercise_id in state.exercises:
        ex_state = state.exercises[state.current_exercise_id]
        current_exercise = ex_state.exercise
        last_feedback = ex_state.last_feedback

    return {
        "tutor": {
            "name": state.tutor.naam,
        },
        "config": asdict(state.config),
        "chat_history": [
            {"role": t.role, "text": t.text}
            for t in state.history
        ],
        "current_exercise": current_exercise,
        "current_exercise_id": state.current_exercise_id,
        "current_feedback": last_feedback,
    }


# ================================================================
#  Conversatie Manager
# ================================================================

class ConversationManager:
    def __init__(self, state: SessionState):
        self.state = state

    # ---------- Hulpfuncties ---------- #

    def _summarize_history(self, max_turns: int = 6) -> str:
        recent = self.state.history[-max_turns:]
        lines = []
        for turn in recent:
            prefix = "Leerling:" if turn.role == "user" else "Tutor:"
            lines.append(f"{prefix} {turn.text}")
        return "\n".join(lines) if lines else "Nog geen eerdere chatgeschiedenis."

    def _describe_exercise(self, ex: Dict[str, Any]) -> str:
        ex_type = ex.get("type", "unknown")
        topic = ex.get("topic", "onbekend topic")
        difficulty = ex.get("difficulty", "unknown")
        meta = ex.get("metadata", {}) or {}
        theme = meta.get("theme", "general")

        content = ex.get("content", {}) or {}

        if ex_type == "mcq":
            desc = textwrap.dedent(f"""
            Type: multiple choice (grammar)
            Topic: {topic}, Difficulty: {difficulty}, Theme: {theme}
            Vraag (Engels): {content.get('question')}
            Opties: {content.get('options')}
            """).strip()
        elif ex_type == "gapfill":
            desc = textwrap.dedent(f"""
            Type: invuloefening (gapfill)
            Topic: {topic}, Difficulty: {difficulty}, Theme: {theme}
            Zin (Engels): {content.get('sentence')}
            """).strip()
        elif ex_type == "writing":
            desc = textwrap.dedent(f"""
            Type: schrijfopdracht
            Topic: {topic}, Difficulty: {difficulty}, Theme: {theme}
            Prompt (Engels): {content.get('prompt')}
            Rubric: {content.get('rubric')}
            Woordenlimiet: {content.get('word_limit')}
            """).strip()
        elif ex_type == "reading":
            desc = textwrap.dedent(f"""
            Type: reading comprehension
            Topic: {topic}, Difficulty: {difficulty}, Theme: {theme}
            Tekst: {content.get('passage')[:200]}...
            Vraag: {content.get('question')}
            Opties: {content.get('options')}
            """).strip()
        else:
            desc = f"Onbekend type oefening: {ex_type}."

        return desc

    # ---------- Oefeningen ---------- #

    def request_new_exercise(self) -> Dict[str, Any]:
        """
        Genereer een nieuwe oefening via exercise_generator.
        """
        cfg = self.state.config
        exercise = generate_exercise_with_llm(
            skill=cfg.skill,
            topic=cfg.topic,
            theme=cfg.theme,
            difficulty=cfg.difficulty,
        )
        ex_id = exercise["exercise_id"]
        self.state.exercises[ex_id] = ExerciseState(exercise=exercise)
        self.state.current_exercise_id = ex_id
        return exercise

    def submit_answer(self, answer: str) -> Dict[str, Any]:
        """
        Antwoord op huidige oefening nakijken + feedback genereren.
        """
        if not self.state.current_exercise_id:
            raise ValueError("Geen actieve oefening.")

        ex_state = self.state.exercises[self.state.current_exercise_id]
        exercise = ex_state.exercise

        # 1) Nakijken
        check_result = check_answer(exercise, answer)

        # 2) Feedback genereren (met gekozen tutor)
        feedback_result = generate_feedback(
            exercise=exercise,
            student_answer=answer,
            check_result=check_result,
            personality=self.state.tutor,
        )

        # 3) State updaten
        ex_state.last_answer = answer
        ex_state.last_check = check_result
        ex_state.last_feedback = feedback_result

        # 4) Kort chatbericht ook in history (optioneel)
        summary_text = (
            f"Ik heb je antwoord nagekeken op oefening {exercise['exercise_id']}. "
            f"Resultaat: {check_result['result']} (score {check_result.get('score', 0):.2f})."
        )
        self.state.history.append(ChatTurn(role="tutor", text=summary_text))

        return {
            "check_result": check_result,
            "feedback": feedback_result,
            "summary_message": summary_text,
        }

    # ---------- Chat / uitleg ---------- #

    def _build_explanation_prompt(self, user_message: str, ex_state: ExerciseState) -> str:
        """
        Prompt om specifiek uitleg te geven over de huidige oefening.
        """
        ex = ex_state.exercise
        check = ex_state.last_check
        fb = ex_state.last_feedback

        exercise_desc = self._describe_exercise(ex)

        check_summary = ""
        if check:
            check_summary = textwrap.dedent(f"""
            Resultaat van eerdere nakijk-check:
            - Resultaat: {check.get('result')}
            - Score: {check.get('score')}
            - Verwacht: {check.get('expected')}
            - Skill: {check.get('details', {}).get('skill')}
            - Fouttypes: {check.get('details', {}).get('error_types', [])}
            """).strip()

        feedback_summary = ""
        if fb:
            feedback_summary = textwrap.dedent(f"""
            Samenvatting van eerdere feedbacktekst:
            {fb.get('feedback_text', '')[:400]}
            """).strip()

        history_summary = self._summarize_history()

        personality = self.state.tutor

        prompt = f"""
{BASE_TUTOR_RULES}

ACTIEVE TUTOR
-------------
Naam: {personality.naam}

ROL
---
{personality.rol}

GEDRAG
------
{personality.gedrag}

SPECIFIEKE REGELS
-----------------
{personality.regels}

CHATGESCHIEDENIS (laatste beurten)
----------------------------------
{history_summary}

HUIDIGE OEFENING
----------------
{exercise_desc}

{check_summary}

{feedback_summary}

VRAAG VAN DE LEERLING OVER DEZE OEFENING
----------------------------------------
{user_message}

TAAK VOOR DE TUTOR
------------------
- Leg in het Nederlands uit hoe deze oefening werkt of waarom een antwoord goed/fout is.
- Verwijs waar nuttig naar concrete delen van de oefening (vraag, zin, opties).
- Focus uitsluitend op deze oefening en deze vraag van de leerling.
- Bedenk GEEN nieuwe oefening en vraag de leerling niet om een nieuwe zin te maken.
- Gebruik maximaal 5–6 zinnen.
- Antwoord als {personality.naam} en houd je aan de beschrijving hierboven.

NU HET ANTWOORD VOOR DE LEERLING:
""".strip()

        return prompt

    def _build_general_chat_prompt(self, user_message: str) -> str:
        """
        Prompt voor algemene chat / uitleg (niet direct gekoppeld aan een specifieke oefening).
        """
        history_summary = self._summarize_history()
        personality = self.state.tutor

        prompt = f"""
{BASE_TUTOR_RULES}

ACTIEVE TUTOR
-------------
Naam: {personality.naam}

ROL
---
{personality.rol}

GEDRAG
------
{personality.gedrag}

SPECIFIEKE REGELS
-----------------
{personality.regels}

CHATGESCHIEDENIS (laatste beurten)
----------------------------------
{history_summary}

NIEUWE BOODSCHAP VAN DE LEERLING
--------------------------------
{user_message}

TAAK VOOR DE TUTOR
------------------
- Geef antwoord in het Nederlands (korte Engelse voorbeeldzinnen zijn oké).
- Pas je toon en stijl aan volgens de tutor-persoonlijkheid.
- Geef waar passend een korte uitleg, voorbeeld of tip.
- Bedenk geen nieuwe oefening en geen uitgebreide huiswerkopdracht.
- Gebruik maximaal 5–6 zinnen.

NU HET ANTWOORD VOOR DE LEERLING:
""".strip()

        return prompt

    def handle_user_chat(self, text: str) -> str:
        """
        Verwerkt een gewone chatboodschap van de leerling.
        Geeft alleen de tekst van het tutor-antwoord terug.
        """
        self.state.history.append(ChatTurn(role="user", text=text))

        lower = text.lower()
        has_current_ex = self.state.current_exercise_id is not None
        ex_state = self.state.exercises.get(self.state.current_exercise_id) if has_current_ex else None

        looks_like_explanation_q = any(
            kw in lower for kw in ["waarom", "uitleg", "leg uit", "snap niet", "begrijp niet", "wat is hier"]
        )

        if has_current_ex and looks_like_explanation_q:
            prompt = self._build_explanation_prompt(text, ex_state)
        else:
            prompt = self._build_general_chat_prompt(text)

        try:
            answer = llm_chat_call(prompt)
        except Exception as e:
            answer = (
                "Er ging iets mis bij het aanroepen van de taalmodule. "
                f"Technische fout: {e}"
            )

        self.state.history.append(ChatTurn(role="tutor", text=answer))
        return answer

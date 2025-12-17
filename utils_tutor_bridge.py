import json
import re
from typing import Dict, Any

from ai_tutor_main import (
    Oefening,
    OefeningType,
    Moeilijkheidsgraad,
)

def oefening_naar_exercise(o: Oefening) -> Dict[str, Any]:
    diff_map = {
        Moeilijkheidsgraad.MAKKELIJK: "easy",
        Moeilijkheidsgraad.GEMIDDELD: "medium",
        Moeilijkheidsgraad.MOEILIJK: "hard",
    }
    base = {
        "exercise_id": o.id,
        "topic": o.onderwerp,
        "difficulty": diff_map[o.moeilijkheid],
        "instructions": o.instructie,
        "metadata": {"source": "api_v1"},
    }

    if o.type == OefeningType.GRAMMATICA_MEERKEUZE:
        return {
            **base,
            "type": "mcq",
            "content": {"question": o.content, "options": o.opties or []},
            "answer_key": {"correct": o.juist_antwoord},
        }

    if o.type == OefeningType.GRAMMATICA_GAPFILL:
        return {
            **base,
            "type": "gapfill",
            "content": {"stem": o.content},
            "answer_key": {"correct": [o.juist_antwoord], "alternatives": []},
        }

    if o.type in [
        OefeningType.SCHRIJVEN_EMAIL,
        OefeningType.SCHRIJVEN_ARTIKEL,
        OefeningType.SCHRIJVEN_REVIEW,
    ]:
        rubric = {}
        try:
            rubric = json.loads(o.content)
        except Exception:
            rubric = {}
        return {
            **base,
            "type": "writing",
            "content": {"prompt": o.instructie, "rubric": rubric},
            "answer_key": None,
        }

    # fallback voor lezen
    return {
        **base,
        "type": "reading",
        "content": {"passage": o.content, "question": "Beantwoord", "options": o.opties or []},
        "answer_key": {"correct": o.juist_antwoord},
    }

# ---------- Simple Rule Checker ----------

def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower()).replace("’", "'")

def _similar(a: str, b: str) -> float:
    A, B = set(_norm(a).split()), set(_norm(b).split())
    if not A or not B:
        return 0.0
    return len(A & B) / len(A | B)

def rule_check(exercise: Dict[str, Any], payload: Dict[str, Any]):
    t = exercise["type"]

    if t == "mcq":
        opts = exercise["content"]["options"]
        correct = _norm(exercise["answer_key"]["correct"])
        user = payload.get("choice") or payload.get("text") or ""
        if user.isdigit():
            i = int(user) - 1
            if 0 <= i < len(opts):
                user = opts[i]
        u = _norm(user)
        if u == correct:
            return "CORRECT"
        if _similar(u, correct) > 0.7:
            return "ALMOST"
        return "INCORRECT"

    if t == "gapfill":
        corrects = [_norm(c) for c in exercise["answer_key"].get("correct", [])]
        alts = [_norm(c) for c in exercise["answer_key"].get("alternatives", [])]
        u = _norm(payload.get("text") or "")
        if u in corrects or u in alts:
            return "CORRECT"
        if any(_similar(u, c) > 0.7 for c in corrects + alts):
            return "ALMOST"
        return "INCORRECT"

    return "NEEDS_REVIEW"

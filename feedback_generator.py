# feedback_generator.py
import json
import textwrap
from dataclasses import dataclass
from typing import Dict, Any

import requests

# Let op: dit importeert je bestaande onderdelen
from answer_checker import (
    MCQ_EXERCISES,
    GAPFILL_EXERCISES,
    WRITING_EXERCISES,
    check_answer,
)
from tutor_personalities import TutorPersonaliteiten, TutorPersoonlijkheid

# ------------------ Config Ollama ------------------ #

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:7b"


def call_ollama(prompt: str, model: str = OLLAMA_MODEL, stream: bool = False) -> str:
    """
    Eenvoudige HTTP-call naar Ollama, zelfde stijl als in exercise_generator.py
    """
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
    }
    resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    return data.get("response", "")


# ------------------ Feedback generator kern ------------------ #

def short_error_summary(details: Dict[str, Any]) -> str:
    """
    Maak een korte samenvatting van fouttypes, zodat de LLM weet waar hij
    zich op moet focussen, zonder dat jij zelf logica hoeft te schrijven.
    """
    error_types = details.get("error_types", []) or []
    if not error_types:
        return "Geen specifieke fouttypes gedetecteerd."

    # Je kunt dit later uitbreiden met mooiere mapping
    return "Gedetecteerde fouttypes: " + ", ".join(error_types)


def build_feedback_prompt(
    exercise: Dict[str, Any],
    student_answer: str,
    check_result: Dict[str, Any],
    personality: TutorPersoonlijkheid,
) -> str:
    """
    Bouwt één grote prompt voor Mistral, inclusief:
    - Tutor persoonlijkheid (rol/gedrag/regels)
    - Oefening + context
    - Oordeel van de Antwoord Checker
    - Heldere opdracht: genereer feedback in het Nederlands
    """

    ex_type = exercise.get("type", "unknown")
    topic = exercise.get("topic", "onbekend topic")
    difficulty = exercise.get("difficulty", "unknown")
    instructions = exercise.get("instructions", "")
    metadata = exercise.get("metadata", {}) or {}
    theme = metadata.get("theme", "general")
    explanation = metadata.get("explanation", "")

    content = exercise.get("content", {}) or {}
    result = check_result.get("result", "incorrect")
    score = check_result.get("score", 0.0)
    expected = check_result.get("expected")
    details = check_result.get("details", {}) or {}
    skill = details.get("skill", "unknown")
    error_summary = short_error_summary(details)

    # Maak een compacte beschrijving van de oefening voor in de prompt
    if ex_type == "mcq":
        exercise_desc = textwrap.dedent(f"""
        Type: multiple choice (grammar)
        Vraag (Engels): {content.get('question')}
        Opties: {content.get('options')}
        """).strip()
    elif ex_type == "gapfill":
        exercise_desc = textwrap.dedent(f"""
        Type: invuloefening (grammar gapfill)
        Zin (Engels): {content.get('sentence')}
        """).strip()
    elif ex_type == "writing":
        exercise_desc = textwrap.dedent(f"""
        Type: schrijfopdracht
        Prompt (Engels): {content.get('prompt')}
        Rubric (Nederlands): {json.dumps(content.get('rubric', {}), ensure_ascii=False)}
        Woordenlimiet: {content.get('word_limit')}
        """).strip()
    else:
        exercise_desc = f"Type: {ex_type} (onbekend type voor deze generator)"

    # Oordeel + studentantwoord
    judgement_block = textwrap.dedent(f"""
    OORDEEL VAN DE ANTWOORD CHECKER:
    - Resultaat: {result}
    - Score: {score:.2f}
    - Verwacht antwoord (indien bekend): {expected}
    - Skill: {skill}
    - {error_summary}

    Antwoord van de leerling:
    {student_answer}
    """).strip()

    # Tutor persoonlijkheid in de prompt stoppen (prompt stacking)
    personality_block = textwrap.dedent(f"""
    [TUTOR PERSOONLIJKHEID]
    Naam: {personality.naam}

    Rol:
    {personality.rol}

    Gedrag:
    {personality.gedrag}

    Regels:
    {personality.regels}
    """).strip()

    # Algemene didactische regels voor feedback (geldig voor alle persoonlijkheden)
    global_feedback_rules = textwrap.dedent("""
    [ALGEMENE FEEDBACKREGELS VOOR DE TUTOR]

    - Doelgroep: Nederlandse HAVO 5 leerlingen (ongeveer B1/B2 Engels).
    - Schrijf je feedback in het Nederlands, maar gebruik Engelse voorbeeldzinnen waar nodig.
    - Houd het kort en concreet (meestal maximaal 4–5 zinnen).
    - De feedback gaat **alleen** over de huidige opdracht en het gegeven antwoord.
    - Geef géén nieuwe oefenzinnen, géén nieuwe opdrachten en vraag de leerling niet om nu iets nieuws te doen.
    - Noem in je feedback altijd:
      1) Een korte positieve opmerking (wat ging goed of was een goed initiatief).
      2) Een duidelijke uitleg waarom het antwoord goed, bijna goed of fout is.
      3) Een tip of mini-uitleg van de regel of aanpak die hierbij hoort.
    - Gebruik geen opsommingslijst in markdown, maar gewoon lopende tekst.
    """).strip()

    # Specifieke instructie per resultaat-type
    if result == "correct":
        situation_hint = (
            "De leerling heeft het antwoord goed. Focus vooral op complimenteren en een korte bevestiging "
            "van de regel of het idee. Houd het bij uitleg over deze opdracht."
        )
    elif result == "almost":
        situation_hint = (
            "De leerling zit er dicht bij. Benoem wat er goed is en leg rustig uit wat nog net niet klopt. "
            "Houd de feedback beperkt tot deze opdracht, zonder nieuwe oefeningen te bedenken."
        )
    else:  # incorrect
        situation_hint = (
            "De leerling heeft het antwoord fout. Benoem vriendelijk maar duidelijk wat er niet klopt, "
            "en leg de juiste oplossing uit met een klein voorbeeld. "
            "Geef alleen uitleg over deze opdracht; geen nieuwe zinnen of opdrachten."
        )


    # Complete prompt
    prompt = textwrap.dedent(f"""
    Jij bent een AI-tutor Engels voor Nederlandse HAVO 5 leerlingen. 
    Je neemt de persoonlijkheid over van de tutor hieronder.

    {personality_block}

    {global_feedback_rules}

    Context van de oefening:
    - Topic (grammatica/vaardigheid): {topic}
    - Theme (inhoudelijk thema): {theme}
    - Difficulty: {difficulty}
    - Didactische uitleg uit metadata (optioneel): {explanation}
    - Instructie voor de leerling (Nederlands): {instructions}

    Beschrijving van de concrete oefening:
    {exercise_desc}

    {judgement_block}

    SITUATIE:
    {situation_hint}

        JOUW TAAK:
    - Genereer nu één vloeiende feedbacktekst in het Nederlands.
    - Pas je toon en stijl aan volgens de tutor-persoonlijkheid.
    - Houd je aan de regels uit de persoonlijkheid en aan de algemene feedbackregels.
    - Houd het bij maximaal 4–5 zinnen.
    - De feedback gaat uitsluitend over de gemaakte opdracht en het gegeven antwoord.
    - Bedenk géén nieuwe oefenzin, géén nieuwe opdracht en vraag de leerling niet om nu iets extra's te doen.
    - Schrijf geen meta-uitleg over wat je aan het doen bent; geef alleen de feedbacktekst zoals je die aan de leerling zou sturen.
    
    Nu de feedbacktekst:
    """).strip()

    return prompt


def generate_feedback(
    exercise: Dict[str, Any],
    student_answer: str,
    check_result: Dict[str, Any],
    personality: TutorPersoonlijkheid,
) -> Dict[str, Any]:
    """
    Hoofdfunctie voor andere onderdelen:
    - bouwt de LLM-prompt
    - roept Ollama/Mistral aan
    - geeft een klein, gestructureerd resultaat terug
    """
    prompt = build_feedback_prompt(exercise, student_answer, check_result, personality)
    print("\n[Debug] Verstuur feedback-prompt naar Ollama...")
    response = call_ollama(prompt).strip()
    print(f"[Debug] Ruwe LLM-respons (eerste 400 chars):\n{response[:400]}\n")

    feedback_text = response.strip()

    return {
        "exercise_id": exercise.get("exercise_id"),
        "result": check_result.get("result"),
        "score": check_result.get("score"),
        "tutor_name": personality.naam,
        "feedback_text": feedback_text,
        "meta": {
            "skill": check_result.get("details", {}).get("skill"),
            "error_types": check_result.get("details", {}).get("error_types", []),
        },
    }


# ------------------ CLI om te testen ------------------ #

def choose_tutor() -> TutorPersoonlijkheid:
    print("\nKies een tutor-persoonlijkheid:")
    print("  1) Meester Jan (vriendelijk, bemoedigend)")
    print("  2) Coach Sara (direct, resultaatgericht)")

    while True:
        choice = input(">> ").strip()
        if choice == "1":
            return TutorPersonaliteiten.meester_jan()
        if choice == "2":
            return TutorPersonaliteiten.coach_sara()
        print("Ongeldige keuze, kies 1 of 2.")


def choose_exercise_set():
    print("\nKies een oefeningstype:")
    print("  1) MCQ (Multiple Choice)")
    print("  2) Gapfill (Invuloefening)")
    print("  3) Writing (Schrijfopdracht)")

    while True:
        c = input(">> ").strip()
        if c == "1":
            return "mcq", MCQ_EXERCISES
        if c == "2":
            return "gapfill", GAPFILL_EXERCISES
        if c == "3":
            return "writing", WRITING_EXERCISES
        print("Ongeldige keuze, probeer opnieuw.")


def choose_exercise(exercises):
    print("\nKies een oefening:")
    for i, ex in enumerate(exercises):
        print(f"  {i + 1}) {ex['exercise_id']}")
    while True:
        raw = input("Nummer >> ").strip()
        if not raw.isdigit():
            print("Voer een nummer in.")
            continue
        idx = int(raw) - 1
        if 0 <= idx < len(exercises):
            return exercises[idx]
        print("Ongeldige keuze, probeer opnieuw.")


def ask_student_answer(exercise: Dict[str, Any]) -> str:
    ex_type = exercise["type"]
    content = exercise["content"]

    print("\n=== OEFENING ===")
    if ex_type == "mcq":
        print(f"\nVraag: {content['question']}\n")
        for i, opt in enumerate(content["options"]):
            print(f"  {i}) {opt}")
        return input("\nJouw antwoord (nummer, letter of tekst): ").strip()
    elif ex_type == "gapfill":
        print(f"\nZin: {content['sentence']}")
        return input("\nVul in: ").strip()
    elif ex_type == "writing":
        print(f"\nSchrijfopdracht: {content['prompt']}")
        wl = content.get("word_limit", {})
        print(f"\nWoordenlimiet: {wl.get('min', '?')}-{wl.get('max', '?')} woorden")
        print("\nRubric:")
        rubric = content.get("rubric", {})
        for key, val in rubric.items():
            print(f"  - {key}: {val}")
        print("\n--- Typ je tekst hieronder (regel met alleen '.' om te stoppen) ---")
        lines = []
        while True:
            line = input()
            if line.strip() == ".":
                break
            lines.append(line)
        return "\n".join(lines)
    else:
        print("Onbekend oefeningstype, vrije invoer:")
        return input("Antwoord: ").strip()


def run_cli():
    print("=== FEEDBACK GENERATOR – met Ollama/Mistral ===")
    print("Niveau: HAVO 5, vak Engels.")
    print("Zorg dat 'ollama serve' draait en het model 'mistral:7b' beschikbaar is.\n")

    tutor = choose_tutor()
    while True:
        ex_type, ex_set = choose_exercise_set()
        exercise = choose_exercise(ex_set)
        student_answer = ask_student_answer(exercise)

        # 1) Eerst nakijken
        print("\n[Debug] Nakijken met answer_checker...")
        check_result = check_answer(exercise, student_answer)
        print("\n=== RESULTAAT NAKIJKEN ===")
        print(json.dumps(check_result, indent=2, ensure_ascii=False))

        # 2) Dan feedback genereren
        try:
            feedback_result = generate_feedback(exercise, student_answer, check_result, tutor)
        except Exception as e:
            print("\n❌ Er ging iets mis bij het genereren van feedback:")
            print(e)
            continue

        print("\n=== FEEDBACK VAN DE TUTOR ===")
        print(f"[{feedback_result['tutor_name']}] {feedback_result['feedback_text']}\n")

        # Nog een keer?
        again = input("Nog een feedback-test doen? (y/n) ").strip().lower()
        if again != "y":
            print("Tot ziens!")
            break


if __name__ == "__main__":
    run_cli()

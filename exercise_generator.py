import uuid
import json
import textwrap
import random
from typing import Optional

import requests

# Config
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:7b"


DIFFICULTIES = ["easy", "medium", "hard"]
SKILLS = ["grammar", "reading", "writing"]
TYPES_PER_SKILL = {
    "grammar": ["gapfill", "mcq"],
    "reading": ["reading"],
    "writing": ["writing"],
}


# ------------------ Helpers ------------------ #

def generate_exercise_id() -> str:
    return f"ex_{uuid.uuid4().hex[:8]}"


def normalize_theme(theme: str) -> str:
    theme = (theme or "").strip().lower()
    if not theme:
        return "general"
    mapping = {
        "reizen": "travel",
        "vakantie": "travel",
        "school": "school",
        "technologie": "technology",
        "tech": "technology",
        "milieu": "environment",
        "omgeving": "environment",
    }
    return mapping.get(theme, theme)


def topic_family(topic: str) -> str:
    t = (topic or "").lower()
    if "present perfect" in t:
        return "present_perfect"
    if "present simple" in t or "simple present" in t:
        return "present_simple"
    if "past simple" in t or "simple past" in t:
        return "past_simple"
    if "condition" in t:
        return "conditional"
    return "generic"


# ------------------ Ollama / LLM ------------------ #

def call_ollama(prompt: str, model: str = OLLAMA_MODEL, stream: bool = False) -> str:

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": stream,
    }
    resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    # bij stream=False geeft Ollama één JSON-object terug met key "response"
    return data.get("response", "")


def extract_json_from_text(text: str) -> dict:

    # strip eventuele code fences
    if "```" in text:
        # simpele aanpak: pak alles tussen eerste ``` en laatste ```
        parts = text.split("```")
        # zoek stuk waar waarschijnlijk JSON in zit
        candidate = ""
        for part in parts:
            if "{" in part and "}" in part:
                candidate = part
                break
        if candidate:
            text = candidate

    # zoek eerste { en laatste }
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Kon geen JSON-object vinden in LLM-output.")

    json_str = text[start:end+1]
    return json.loads(json_str)


# ------------------ Promptbouwers ------------------ #

def build_llm_prompt(
    exercise_type: str,
    skill: str,
    topic: str,
    theme: str,
    difficulty: str,
) -> str:
    """
    Bouwt een instructie voor Mistral die uitlegt:
    - wie de leerling is (Nederlandse HAVO 5 → B1/B2)
    - wat voor oefeningstype we willen
    - welke JSON-structuur exact gebruikt moet worden
    - dat er ALLEEN JSON terug moet komen
    """

    theme_norm = normalize_theme(theme)
    topic = topic or "General English"

    # Extra context per type
    # Extra context per type
    if exercise_type == "gapfill":
        type_description = textwrap.dedent("""
        - Maak één grammaticale invuloefening (gapfill) in het Engels.
        - De zin zelf is Engels, de instructie is in het Nederlands.
        - De zin moet het opgegeven topic oefenen (bijv. een specifieke tijd of structuur).
        - Stop de zin in het JSON-veld "sentence".uvicorn
        """).strip()
        # LET OP: hier gebruiken we "sentence" i.p.v. "stem"
        content_schema = '"content": { "sentence": "She ___ (work) here." }'
        answer_key_schema = '"answer_key": { "correct_answer": "works" }'
    elif exercise_type == "mcq":
        type_description = textwrap.dedent("""
        - Maak één grammaticale meerkeuzevraag (multiple choice, MCQ) in het Engels.
        - De vraag zelf is Engels, de instructie is in het Nederlands.
        - Geef 4 opties waarvan er precies 1 goed is.
        """).strip()
        content_schema = textwrap.dedent("""
        "content": {
          "question": "You ___ go there.",
          "options": ["must", "should", "can", "might"]
        }
        """).strip()
        answer_key_schema = textwrap.dedent("""
        "answer_key": {
          "correct_index": 1,
          "correct_option": "should"
        }
        """).strip()
    elif exercise_type == "reading":
        type_description = textwrap.dedent("""
        - Maak een korte leestekst (ongeveer 150–250 woorden) in het Engels.
        - Daarna één meerkeuzevraag over de hoofdgedachte of een belangrijk detail.
        - De tekst en vraag zijn Engels, de instructie is in het Nederlands.
        """).strip()
        content_schema = textwrap.dedent("""
        "content": {
          "passage": "Long text here...",
          "question": "What is the main idea of the text?",
          "options": ["A", "B", "C", "D"]
        }
        """).strip()
        answer_key_schema = textwrap.dedent("""
        "answer_key": {
          "correct_index": 2,
          "correct_option": "C"
        }
        """).strip()
    else:  # writing
        type_description = textwrap.dedent("""
        - Maak één schrijfopdracht in het Engels.
        - De opdrachttekst (prompt) is Engels, de instructie is in het Nederlands.
        - Voeg een rubric toe met korte Nederlandse uitleg over structuur, inhoud en taal.
        """).strip()
        content_schema = textwrap.dedent("""
        "content": {
          "prompt": "Write an email...",
          "rubric": {
            "structure": "...",
            "content": "...",
            "language": "...",
            "length": "..."
          },
          "word_limit": { "min": 80, "max": 100 }
        }
        """).strip()
        answer_key_schema = '"answer_key": null'

    base_schema = textwrap.dedent(f"""
    {{
      "exercise_id": "ex_12345678",  // vul een willekeurig id in of laat het leeg
      "type": "{exercise_type}",
      "topic": "{topic}",
      "difficulty": "{difficulty}",
      "instructions": "Nederlandse instructie voor de leerling.",
      {content_schema},
      {answer_key_schema},
      "metadata": {{
        "theme": "{theme_norm}",
        "explanation": "Korte Nederlandse uitleg over het doel of de grammatica."
      }}
    }}
    """).strip()

    prompt = textwrap.dedent(f"""
    Jij bent een AI-tutor die oefeningen Engels maakt voor Nederlandse leerlingen van HAVO 5 (ongeveer B1/B2 niveau).

    Doel:
    - Genereer één oefening in JSON-formaat.
    - De leerling kan zelf een topic en thema kiezen, die moet jij verwerken in de oefening.
    - Houd het Engels passend bij HAVO 5 (niet te makkelijk, niet te moeilijk).

    Instellingen voor deze oefening:
    - Skill: {skill}
    - Type: {exercise_type}
    - Topic (grammatica / vaardigheid): "{topic}"
    - Theme (inhoudelijk thema): "{theme_norm}"
    - Difficulty: {difficulty}

    Richtlijnen:
    {type_description}

    Belangrijk:
    - De veldnamen moeten precies overeenkomen met het schema hieronder.
    - "instructions" is in het Nederlands.
    - De inhoud van de oefening (zin, tekst, prompt) is in het Engels.
    - Zorg dat de oefening echt het gegeven topic EN het thema gebruikt.
    - Difficulty:
      * easy: eenvoudige zinnen/teksten.
      * medium: normale HAVO 5 moeilijkheid.
      * hard: iets complexere zinnen/teksten en woordenschat.
    - Geef ALLEEN een JSON-object terug, zonder extra uitleg of tekst eromheen.

    JSON-schema (voorbeeld, houd sleutel-namen exact aan, maar pas de inhoud aan):

    {base_schema}

    Nu: genereer één concrete oefening als geldig JSON-object.
    """).strip()

    return prompt


# ------------------ Generator op basis van LLM ------------------ #

def generate_exercise_with_llm(
    skill: str,
    topic: str,
    theme: str,
    difficulty: str = "medium",
    exercise_type: Optional[str] = None,
) -> dict:
    skill = (skill or "").lower()
    if skill not in SKILLS:
        skill = "grammar"

    if difficulty not in DIFFICULTIES:
        difficulty = "medium"

    # Kies type als het niet is opgegeven
    valid_types = TYPES_PER_SKILL[skill]
    if exercise_type not in valid_types:
        # bij grammar random gapfill/mcq, anders eerste (reading/writing)
        exercise_type = random.choice(valid_types) if len(valid_types) > 1 else valid_types[0]

    prompt = build_llm_prompt(exercise_type, skill, topic, theme, difficulty)

    raw_output = call_ollama(prompt)
    parsed = extract_json_from_text(raw_output)

    # Zorgen dat exercise_id bestaat en type/difficulty/topic zijn ingevuld
    if "exercise_id" not in parsed or not parsed["exercise_id"]:
        parsed["exercise_id"] = generate_exercise_id()
    else:
        # we kunnen ook onze eigen id overrulen, om het formaat consistent te houden
        parsed["exercise_id"] = generate_exercise_id()

    # fallback / sanity checks
    parsed["type"] = exercise_type
    parsed.setdefault("topic", topic)
    parsed.setdefault("difficulty", difficulty)

    # metadata.theme bijwerken met genormaliseerd thema als het ontbreekt
    meta = parsed.get("metadata", {}) or {}
    meta.setdefault("theme", normalize_theme(theme))
    parsed["metadata"] = meta

    return parsed


# ------------------ CLI ------------------ #

def ask_with_default(prompt_text: str, default: str = "") -> str:
    raw = input(f"{prompt_text} [{default}]: ").strip()
    return raw or default


def configure_settings(
    current_topic: str,
    current_theme: str,
    current_skill: str,
    current_difficulty: str,
):
    print("\n--- Nieuwe configuratie ---")
    topic = ask_with_default(
        "Voer een topic in (bijv. Present Perfect, Conditionals, Reading skills)",
        current_topic or "Present Perfect"
    )
    theme = ask_with_default(
        "Voer een thema in (bijv. travel, school, environment)",
        current_theme or "school"
    )
    skill = ask_with_default(
        "Kies skill (grammar/reading/writing)",
        current_skill
    )
    difficulty = ask_with_default(
        "Kies moeilijkheid (easy/medium/hard)",
        current_difficulty
    )

    print("\nConfiguratie opgeslagen:")
    print(f"  Topic       : {topic}")
    print(f"  Thema       : {theme}")
    print(f"  Skill       : {skill}")
    print(f"  Moeilijkheid: {difficulty}")
    print("---------------------------\n")

    return topic, theme, skill, difficulty


def cli_loop():
    print("=== AI English Tutor – Oefeningengenerator met Ollama/Mistral (CLI) ===")
    print("Niveau: HAVO 5 (ongeveer B1/B2).")
    print("Zorg dat 'ollama serve' draait en dat het model 'mistral:7b' beschikbaar is.\n")

    current_topic = ""
    current_theme = ""
    current_skill = "grammar"
    current_difficulty = "medium"

    current_topic, current_theme, current_skill, current_difficulty = configure_settings(
        current_topic,
        current_theme,
        current_skill,
        current_difficulty,
    )

    while True:
        print("Maak een keuze:")
        print("  1) Genereer een nieuwe oefening met huidige instellingen (via Mistral)")
        print("  2) Verander topic/thema/skill/moeilijkheid")
        print("  q) Stoppen")
        choice = input(">> ").strip().lower()

        if choice == "1":
            try:
                exercise = generate_exercise_with_llm(
                    skill=current_skill,
                    topic=current_topic,
                    theme=current_theme,
                    difficulty=current_difficulty,
                )
                print("\n--- Nieuwe oefening (LLM) ---")
                print(json.dumps(exercise, indent=2, ensure_ascii=False))
                print("------------------------------\n")
            except Exception as e:
                print("\nEr ging iets mis bij het genereren met de LLM:")
                print(e)
                print("Controleer of 'ollama serve' draait en het model beschikbaar is.\n")
                continue

            # Sub-loop: nog een / hoofdmenu / stoppen
            while True:
                follow = input("N = nog een oefening, M = hoofdmenu, Q = stoppen: ").strip().lower()
                if follow == "n":
                    try:
                        exercise = generate_exercise_with_llm(
                            skill=current_skill,
                            topic=current_topic,
                            theme=current_theme,
                            difficulty=current_difficulty,
                        )
                        print("\n--- Nieuwe oefening (LLM) ---")
                        print(json.dumps(exercise, indent=2, ensure_ascii=False))
                        print("------------------------------\n")
                    except Exception as e:
                        print("\nEr ging iets mis bij het genereren met de LLM:")
                        print(e)
                        print("Controleer of 'ollama serve' draait en het model beschikbaar is.\n")
                        break
                elif follow == "m":
                    break
                elif follow == "q":
                    print("Tot ziens!")
                    return
                else:
                    print("Ongeldige keuze, probeer opnieuw.")
        elif choice == "2":
            current_topic, current_theme, current_skill, current_difficulty = configure_settings(
                current_topic,
                current_theme,
                current_skill,
                current_difficulty,
            )
        elif choice == "q":
            print("Tot ziens!")
            break
        else:
            print("Ongeldige keuze, probeer opnieuw.\n")


if __name__ == "__main__":
    cli_loop()

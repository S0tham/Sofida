import json
import re
import subprocess

# ================================================================
#  Hardcoded oefening JSON's
# ================================================================

MCQ_EXERCISES = [
    {
        "exercise_id": "mcq_01",
        "type": "mcq",
        "content": {
            "question": "Which sentence is in the present perfect?",
            "options": [
                "I eat breakfast every day.",
                "I have eaten breakfast already.",
                "I will eat breakfast soon.",
                "I am eating breakfast."
            ]
        },
        "answer_key": {
            "correct_index": 1,
            "correct_option": "I have eaten breakfast already."
        }
    },
    {
        "exercise_id": "mcq_02",
        "type": "mcq",
        "content": {
            "question": "Which option describes a habit?",
            "options": [
                "She goes running every morning.",
                "She is running right now.",
                "She has run three times this week.",
                "She will run tomorrow."
            ]
        },
        "answer_key": {
            "correct_index": 0,
            "correct_option": "She goes running every morning."
        }
    }
]

GAPFILL_EXERCISES = [
    {
        "exercise_id": "gap_01",
        "type": "gapfill",
        "content": {
            "sentence": "She ____ to school every day.",
        },
        "answer_key": {
            "correct_answer": "goes"
        }
    },
    {
        "exercise_id": "gap_02",
        "type": "gapfill",
        "content": {
            "sentence": "I have ____ my homework already.",
        },
        "answer_key": {
            "correct_answer": "done"
        }
    }
]

WRITING_EXERCISES = [
    {
        "exercise_id": "write_01",
        "type": "writing",
        "content": {
            "prompt": "Write an email to your teacher explaining why you were absent.",
            "rubric": {
                "structure": "Use a greeting, body and ending.",
                "content": "Explain the reason clearly.",
                "language": "Use correct grammar and spelling."
            },
            "word_limit": {"min": 50, "max": 80}
        },
        "answer_key": {}
    },
    {
        "exercise_id": "write_02",
        "type": "writing",
        "content": {
            "prompt": "Describe your best holiday experience.",
            "rubric": {
                "structure": "Use paragraphs.",
                "content": "Give specific details.",
                "language": "Use past tenses correctly."
            },
            "word_limit": {"min": 60, "max": 100}
        },
        "answer_key": {}
    }
]


# ================================================================
#  Utilities
# ================================================================

def normalize_text(text: str) -> str:
    """Normalize text for comparison"""
    return " ".join(text.strip().lower().split())


def map_mcq_answer_to_index(answer, options):
    """Convert student answer to option index"""
    answer = answer.strip()

    # Letter A/B/C/D
    if len(answer) == 1 and answer.upper() in "ABCD":
        return "ABCD".index(answer.upper())

    # Nummer
    if answer.isdigit():
        idx = int(answer)
        if 0 <= idx < len(options):
            return idx

    # Tekst-match
    norm = normalize_text(answer)
    for i, opt in enumerate(options):
        if normalize_text(opt) == norm:
            return i
    return None


# ================================================================
#  LLM Interface
# ================================================================

def call_ollama(prompt: str, model: str = "mistral:instruct") -> str:
    """
    Stuurt een prompt naar Ollama en retourneert de ruwe output (UTF-8 veilig).
    """
    try:
        result = subprocess.run(
            ["ollama", "run", model],
            input=prompt,
            text=True,
            encoding="utf-8",
            errors="replace",  # Changed from 'ignore' to 'replace' for better debugging
            capture_output=True,
            timeout=120  # Add timeout to prevent hanging
        )
        if result.returncode != 0:
            raise RuntimeError(f"Ollama-fout: {result.stderr}")
        return result.stdout
    except FileNotFoundError:
        raise RuntimeError("Ollama lijkt niet geïnstalleerd of niet in PATH.")
    except subprocess.TimeoutExpired:
        raise RuntimeError("Ollama-aanroep duurde te lang (timeout).")
    except Exception as e:
        raise RuntimeError(f"Onverwachte fout bij aanroepen van Ollama: {e}")


def extract_json_from_llm_response(response: str) -> dict:
    """
    Improved JSON extraction from LLM response with multiple fallback strategies.
    """
    # Remove any markdown code fences
    if "```json" in response:
        # Extract content between ```json and ```
        pattern = r"```json\s*(.*?)\s*```"
        matches = re.findall(pattern, response, re.DOTALL)
        if matches:
            response = matches[0]
    elif "```" in response:
        # Extract content between ``` and ```
        pattern = r"```\s*(.*?)\s*```"
        matches = re.findall(pattern, response, re.DOTALL)
        if matches:
            response = matches[0]

    # Try to find JSON object
    start = response.find("{")
    end = response.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("Geen JSON-object gevonden in LLM-output.")

    json_str = response[start:end + 1]

    # Try parsing directly
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"[Debug] Direct JSON parsing failed: {e}")
        print(f"[Debug] Attempting to fix JSON...")

    # Try fixing escaped quotes
    if '\\"' in json_str:
        try:
            cleaned = json_str.replace('\\"', '"')
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

    # Try fixing single quotes (common LLM mistake)
    try:
        fixed = json_str.replace("'", '"')
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # Last resort: extract key fields manually
    print("[Debug] JSON parsing volledig mislukt, gebruik handmatige extractie...")
    return extract_fields_manually(response)


def extract_fields_manually(response: str) -> dict:
    """
    Manually extract key fields when JSON parsing fails.
    """
    result = {
        "overall_score": 0.5,
        "result": "almost",
        "criteria": {
            "structure": 0.5,
            "content": 0.5,
            "language": 0.5
        },
        "error_types": [],
        "comments": "Automatische fallback-score (parsing mislukt)."
    }

    # Try to extract overall_score
    score_match = re.search(r'"overall_score"\s*:\s*([0-9.]+)', response)
    if score_match:
        try:
            result["overall_score"] = float(score_match.group(1))
        except ValueError:
            pass

    # Try to extract result
    result_match = re.search(r'"result"\s*:\s*["\']([^"\']+)["\']', response)
    if result_match:
        result["result"] = result_match.group(1)

    # Try to extract comments
    comments_match = re.search(r'"comments"\s*:\s*["\']([^"\']+)["\']', response)
    if comments_match:
        result["comments"] = comments_match.group(1)

    return result


def llm_score_writing(prompt: str, rubric: dict, student_answer: str) -> dict:
    """
    Laat Mistral een objectieve beoordeling geven van een schrijfopdracht.
    Geen feedback - alleen scores en error types voor de Feedback Generator.
    """
    rubric_text = json.dumps(rubric, indent=2, ensure_ascii=False)

    system_prompt = f"""You are an objective English writing assessor for Dutch HAVO 5 students (B1/B2 level).

CRITICAL: Your response must be ONLY valid JSON. No explanations, no markdown, no backticks.

TASK:
Evaluate this student's writing based on the prompt and rubric below.
DO NOT provide feedback - only objective scores and error types.

PROMPT:
{prompt}

RUBRIC:
{rubric_text}

STUDENT ANSWER:
{student_answer}

Return ONLY this JSON structure (no other text):

{{
  "overall_score": 0.85,
  "result": "correct",
  "criteria": {{
    "structure": 0.9,
    "content": 0.8,
    "language": 0.85
  }},
  "error_types": ["minor_grammar", "spelling"]
}}

Rules for scoring:
- overall_score: 0.0 to 1.0 (0.8+ = correct, 0.5-0.79 = almost, <0.5 = incorrect)
- result: "correct", "almost", or "incorrect"
- Each criterion score: 0.0 to 1.0
- error_types: array of strings identifying issues (e.g. "grammar", "spelling", "structure", "content", "coherence", "vocabulary")

RESPOND WITH ONLY THE JSON OBJECT NOW:"""

    print("\n[Debug] Stuur prompt naar Ollama...")
    response = call_ollama(system_prompt).strip()
    print(f"[Debug] Ruwe LLM response (eerste 500 chars):\n{response[:500]}\n")

    try:
        result = extract_json_from_llm_response(response)
        print("[Debug] JSON parsing succesvol!")
        return result
    except Exception as e:
        print(f"\n[Waarschuwing] Kon JSON niet extraheren: {e}")
        raise RuntimeError(
            f"LLM gaf ongeldige of onvolledige JSON terug.\n"
            f"Fout: {e}\n"
            f"Ruwe output (eerste 1000 chars):\n{response[:1000]}"
        )


def check_writing(exercise: dict, student_answer: str) -> dict:
    """
    Check a writing exercise with LLM evaluation.
    """
    content = exercise["content"]
    rubric = content["rubric"]
    prompt = content["prompt"]

    # Word count check
    words = len(student_answer.split())
    min_wc = content["word_limit"]["min"]
    max_wc = content["word_limit"]["max"]

    word_count_error = None
    if words < min_wc:
        word_count_error = "too_short"
    elif words > max_wc:
        word_count_error = "too_long"

    # Try LLM evaluation
    try:
        print(f"\n[Info] Evalueer schrijfopdracht met LLM...")
        llm_result = llm_score_writing(prompt, rubric, student_answer)
        llm_failed = False
        print(f"[Info] LLM-evaluatie succesvol: score={llm_result['overall_score']}")
    except Exception as e:
        print(f"\n[Waarschuwing] LLM-beoordeling is mislukt: {e}")
        llm_failed = True

        # Fallback score
        base_score = 0.7
        if word_count_error:
            base_score = 0.5

        llm_result = {
            "overall_score": base_score,
            "result": "almost" if base_score >= 0.6 else "incorrect",
            "criteria": {
                "structure": base_score,
                "content": base_score,
                "language": base_score
            },
            "error_types": [],
            "comments": "Automatische fallback-score (LLM kon niet worden gebruikt)."
        }

    # Add word count error if present
    error_types = llm_result.get("error_types", [])
    if word_count_error:
        error_types.append(word_count_error)

    return {
        "exercise_id": exercise["exercise_id"],
        "result": llm_result["result"],
        "score": llm_result["overall_score"],
        "expected": None,
        "student_normalized": normalize_text(student_answer),
        "details": {
            "skill": "writing",
            "criteria_scores": llm_result.get("criteria", {}),
            "error_types": error_types,
            "comments": llm_result.get("comments"),
            "word_count": words,
            "word_limit": {"min": min_wc, "max": max_wc},
            "llm_used": not llm_failed
        }
    }

def check_reading(exercise: dict, answer: str) -> dict:
    """
    Check a reading comprehension question.

    Structuur van de exercise is vrijwel hetzelfde als mcq:
    - content.options
    - answer_key.correct_index / correct_option

    Het verschil is dat we de skill in de 'details' als 'reading' labelen.
    """
    base_result = check_mcq(exercise, answer)

    # forceer skill = reading in details
    details = base_result.get("details", {})
    details["skill"] = "reading"
    base_result["details"] = details

    return base_result

def check_mcq(exercise: dict, answer: str) -> dict:
    """
    Check a multiple choice question.
    """
    options = exercise["content"]["options"]
    correct_idx = exercise["answer_key"]["correct_index"]

    # Convert answer to index
    student_idx = map_mcq_answer_to_index(answer, options)

    if student_idx is None:
        return {
            "exercise_id": exercise["exercise_id"],
            "result": "incorrect",
            "score": 0.0,
            "expected": exercise["answer_key"]["correct_option"],
            "student_normalized": normalize_text(answer),
            "details": {
                "skill": "grammar",
                "error_types": ["invalid_answer"],
                "comments": "Antwoord kon niet worden herkend."
            }
        }

    is_correct = (student_idx == correct_idx)

    return {
        "exercise_id": exercise["exercise_id"],
        "result": "correct" if is_correct else "incorrect",
        "score": 1.0 if is_correct else 0.0,
        "expected": exercise["answer_key"]["correct_option"],
        "student_answer": options[student_idx] if student_idx < len(options) else answer,
        "details": {
            "skill": "grammar",
            "error_types": [] if is_correct else ["wrong_choice"]
        }
    }


def check_gapfill(exercise: dict, answer: str) -> dict:
    """
    Check a gap-fill exercise.
    """
    correct_answer = exercise["answer_key"]["correct_answer"]
    student_answer = normalize_text(answer)
    correct_normalized = normalize_text(correct_answer)

    is_correct = (student_answer == correct_normalized)

    return {
        "exercise_id": exercise["exercise_id"],
        "result": "correct" if is_correct else "incorrect",
        "score": 1.0 if is_correct else 0.0,
        "expected": correct_answer,
        "student_answer": answer,
        "student_normalized": student_answer,
        "details": {
            "skill": "grammar",
            "error_types": [] if is_correct else ["incorrect_word"]
        }
    }


# ================================================================
#  Router
# ================================================================

def check_answer(exercise, answer):
    """
    Route to appropriate checker based on exercise type.
    """
    t = exercise["type"]
    if t == "mcq":
        return check_mcq(exercise, answer)
    if t == "gapfill":
        return check_gapfill(exercise, answer)
    if t == "writing":
        return check_writing(exercise, answer)
    if t == "reading":
        return check_reading(exercise, answer)
    raise ValueError(f"Ongeldig oefeningstype: {t}")



# ================================================================
#  CLI (met doorlopende loop)
# ================================================================

def run_cli():
    """
    Interactive CLI for testing the answer checker.
    """
    while True:
        print("\n" + "=" * 50)
        print("=== ANTWOORD CHECKER ===")
        print("=" * 50)
        print("\nKies een oefeningstype:\n")
        print("1) MCQ (Multiple Choice)")
        print("2) Gapfill (Invuloefening)")
        print("3) Writing (Schrijfopdracht)")
        print("4) Stoppen")

        choice = input("\nKeuze: ").strip()

        if choice == "4":
            print("\n✓ Programma afgesloten. Tot ziens!")
            break

        if choice == "1":
            exercises = MCQ_EXERCISES
        elif choice == "2":
            exercises = GAPFILL_EXERCISES
        elif choice == "3":
            exercises = WRITING_EXERCISES
        else:
            print("❌ Ongeldige keuze. Probeer opnieuw.")
            continue

        print("\n" + "-" * 50)
        print("Kies een oefening:\n")
        for i, ex in enumerate(exercises):
            print(f"{i + 1}) {ex['exercise_id']}")

        try:
            idx = int(input("\nNummer: ").strip()) - 1
            if idx < 0 or idx >= len(exercises):
                raise ValueError
            exercise = exercises[idx]
        except:
            print("❌ Ongeldige keuze.")
            continue

        print("\n" + "=" * 50)
        print("=== OEFENING ===")
        print("=" * 50)

        if exercise["type"] == "mcq":
            print(f"\nVraag: {exercise['content']['question']}\n")
            for i, opt in enumerate(exercise["content"]["options"]):
                print(f"  {i}) {opt}")
            ans = input("\nJouw antwoord (nummer of tekst): ").strip()

        elif exercise["type"] == "gapfill":
            print(f"\n{exercise['content']['sentence']}")
            ans = input("\nVul in: ").strip()

        elif exercise["type"] == "writing":
            print(f"\nOpdracht: {exercise['content']['prompt']}")
            print(
                f"\nWordtelling: {exercise['content']['word_limit']['min']}-{exercise['content']['word_limit']['max']} woorden")
            print("\nRubric:")
            for key, value in exercise['content']['rubric'].items():
                print(f"  - {key}: {value}")
            print("\n--- Schrijf hieronder (typ een regel met alleen '.' om te stoppen) ---\n")
            lines = []
            while True:
                l = input()
                if l.strip() == ".":
                    break
                lines.append(l)
            ans = "\n".join(lines)

        print("\n" + "=" * 50)
        print("=== RESULTAAT ===")
        print("=" * 50)
        try:
            result = check_answer(exercise, ans)
            print("\n" + json.dumps(result, indent=2, ensure_ascii=False))

            # User-friendly summary
            print("\n" + "-" * 50)
            print("SAMENVATTING:")
            print(f"  Resultaat: {result['result'].upper()}")
            print(f"  Score: {result.get('score', 0):.2f}")
            if 'details' in result and 'comments' in result['details']:
                print(f"  Feedback: {result['details']['comments']}")
        except Exception as e:
            print("\n❌ Er ging iets mis tijdens het nakijken:")
            print(f"   {str(e)}")
            import traceback
            print("\nVolledige foutmelding:")
            traceback.print_exc()

        input("\n[Enter] om verder te gaan...")


if __name__ == "__main__":
    run_cli()
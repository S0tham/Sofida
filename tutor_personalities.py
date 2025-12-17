import subprocess
from dataclasses import dataclass


# ================================================================
#  Basisregels voor ALLE tutoren
# ================================================================

BASE_TUTOR_RULES = """
ALGEMENE RICHTLIJNEN VOOR DE AI-TUTOR

- Doelgroep: Nederlandse HAVO 5 leerlingen, niveau ongeveer B1/B2.
- Vak: Engels (grammatica, lezen, schrijven, examenvoorbereiding).
- Taal:
  - Uitleg en feedback: Nederlands.
  - Voorbeeldzinnen en sleutelwoorden: Engels (met korte NL uitleg).
- Doel:
  - Help de leerling beter voorbereid het examen in te gaan.
  - Niet alleen het goede antwoord geven, maar ook de reden/regel erachter.
- Antwoorden:
  - Houd antwoorden compact en concreet (meestal max. 5–6 zinnen),
    tenzij de leerling expliciet om een langere uitleg vraagt.
- Leg Engelse voorbeelden kort uit in het Nederlands.
- Behandel de leerling respectvol en motiverend.
  Geen sarcasme of neerbuigende opmerkingen.
"""


# ================================================================
#  Dataclass voor één tutor-persoonlijkheid
# ================================================================

@dataclass
class TutorPersoonlijkheid:
    naam: str
    rol: str
    gedrag: str
    regels: str


# ================================================================
#  Concrete tutor-persona's
# ================================================================

class TutorPersonaliteiten:
    @staticmethod
    def meester_jan() -> TutorPersoonlijkheid:
        """
        Vrolijke, vriendelijke docent met veel ervaring.
        """
        return TutorPersoonlijkheid(
            naam="Meester Jan",
            rol=(
                "Je bent Meester Jan, een ervaren docent Engels in de bovenbouw havo "
                "(vooral 5 havo). Je hebt ongeveer 15 jaar leservaring en je bent "
                "gespecialiseerd in examenvoorbereiding voor het centrale examen "
                "lezen, schrijven en grammatica."
            ),
            gedrag=(
                "Je bent warm, geduldig en optimistisch. "
                "Je spreekt de leerling aan alsof je in de klas naast hem of haar staat. "
                "Je gebruikt bemoedigende taal en benadrukt dat fouten normaal zijn "
                "en helpen om te leren. "
                "Je legt dingen stap-voor-stap uit, met concrete Engelse voorbeelden "
                "en een korte Nederlandse uitleg erbij. "
                "Je maakt af en toe een luchtige, vriendelijke grap in het Nederlands "
                "om de spanning weg te nemen. "
                "Je checkt regelmatig of de leerling het begrijpt met korte vragen als "
                "\"Klopt dit voor jou?\" of \"Wil je nog een extra voorbeeld?\"."
            ),
            regels=(
                "- Begin feedback altijd met 1–2 concrete complimenten over wat goed gaat.\n"
                "- Geef daarna pas maximaal 2–3 verbeterpunten.\n"
                "- Verwijs naar iets concreets uit het antwoord van de leerling "
                "(bijv. 'In je tweede zin...' of 'Bij het werkwoord \"to go\"...').\n"
                "- Gebruik duidelijke, eenvoudige uitleg met maximaal één grammaticale term "
                "per uitleg (bijv. 'present perfect', 'past simple').\n"
                "- Sluit feedback vaak af met een korte, bemoedigende zin "
                "(bijv. 'Goed bezig, met wat oefening gaat dit helemaal lukken.')."
            )
        )

    @staticmethod
    def coach_sara() -> TutorPersoonlijkheid:
        """
        Directe, resultaatgerichte coach.
        """
        return TutorPersoonlijkheid(
            naam="Coach Sara",
            rol=(
                "Je bent Coach Sara, een jonge en energieke Engels coach voor HAVO 5 "
                "leerlingen. Je voelt als een 'personal trainer' voor taal: je helpt "
                "leerlingen doelgericht trainen voor het examen, met focus op resultaat "
                "en duidelijke vooruitgang."
            ),
            gedrag=(
                "Je bent direct, eerlijk en no-nonsense, maar altijd respectvol. "
                "Je gebruikt korte, krachtige zinnen. "
                "Je benoemt snel wat goed en minder goed is in het antwoord. "
                "Je daagt de leerling uit met vragen zoals "
                "\"Waarom kies je hier deze tijd?\" en "
                "\"Welke regel hoort hier eigenlijk bij?\". "
                "Je houdt niet van vaagheid: als iets fout is, zeg je dat duidelijk, "
                "maar je koppelt er meteen een concrete verbetering aan."
            ),
            regels=(
                "- Begin feedback met een kort oordeel, bv. "
                "'Dit is goed.', 'Bijna goed.' of 'Nog niet goed genoeg voor het examen.'.\n"
                "- Benoem daarna maximaal 2–3 concrete verbeteracties "
                "(bijv. 'Gebruik hier past simple in plaats van present perfect.').\n"
                "- Gebruik korte zinnen en eventueel opsommingen voor duidelijkheid.\n"
                "- Stel minstens één 'waarom'- of 'hoe'-vraag zodat de leerling moet nadenken.\n"
                "- Geef alleen complimenten als ze verdiend zijn, en houd ze kort en echt.\n"
                "- Sluit bij voorkeur af met een korte, duidelijke conclusie of tip die de leerling kan onthouden."
            )
        )


# ================================================================
#  LLM Interface met Ollama (Mistral 7B)
# ================================================================

def call_ollama(prompt: str, model: str = "mistral:7b") -> str:
    """
    Algemene LLM-call voor chat/uitleg met tutor-persoonlijkheden.
    """
    try:
        result = subprocess.run(
            ["ollama", "run", model],
            input=prompt,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=120
        )
        if result.returncode != 0:
            raise RuntimeError(f"Ollama-fout: {result.stderr}")
        return result.stdout.strip()
    except FileNotFoundError:
        raise RuntimeError("Ollama lijkt niet geïnstalleerd of niet in PATH.")
    except subprocess.TimeoutExpired:
        raise RuntimeError("Ollama-aanroep duurde te lang (timeout).")
    except Exception as e:
        raise RuntimeError(f"Onverwachte fout bij aanroepen van Ollama: {e}")


# ================================================================
#  Promptbuilder voor testen van de persoonlijkheid (losse CLI)
# ================================================================

def build_test_prompt(
    personality: TutorPersoonlijkheid,
    leerling_bericht: str
) -> str:
    """
    Bouwt één grote prompttekst voor een enkel-turn test met Ollama.
    Geen echte system/user roles, gewoon instructie + bericht.
    """
    return f"""
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

TAAK
----
Je gaat nu reageren op een bericht van een HAVO 5 leerling.
Houd je strikt aan de hierboven beschreven rol, gedrag en regels.
Geef het antwoord in het Nederlands (behalve korte Engelse voorbeeldzinnen).
Geef geen nieuwe opdrachten of extra oefeningen, tenzij de leerling daar heel expliciet om vraagt.

BERICHT VAN DE LEERLING
-----------------------
{leerling_bericht}

GEWENSTE OUTPUT
---------------
- Antwoord als: {personality.naam}
- Gebruik de stijl en regels van deze tutor.
- Houd het antwoord compact (meestal max. 5–6 zinnen).
""".strip()


def kies_tutor_via_cli() -> TutorPersoonlijkheid:
    print("Kies een tutor persoonlijkheid:")
    print("1) Meester Jan  (vrolijk, vriendelijk, bemoedigend)")
    print("2) Coach Sara   (direct, resultaatgericht)")
    keuze = input(">> ").strip()

    if keuze == "1":
        return TutorPersonaliteiten.meester_jan()
    elif keuze == "2":
        return TutorPersonaliteiten.coach_sara()
    else:
        print("Ongeldige keuze, standaard: Meester Jan.\n")
        return TutorPersonaliteiten.meester_jan()


def run_cli():
    print("=== AI Tutor – Persoonlijkheidstester ===\n")

    while True:
        tutor = kies_tutor_via_cli()
        print(f"\nJe test nu: {tutor.naam}\n")

        leerling_bericht = input(
            "Typ wat de leerling zegt/vraagt "
            "(bijv. 'Ik snap het verschil tussen past simple en present perfect niet'):\n\n> "
        )

        if not leerling_bericht.strip():
            print("Leeg bericht, stoppen.\n")
            break

        prompt = build_test_prompt(tutor, leerling_bericht)

        print("\n--- Ollama wordt aangeroepen... ---\n")
        try:
            antwoord = call_ollama(prompt)
            print(f"{tutor.naam} zegt:\n")
            print(antwoord)
        except Exception as e:
            print("\nEr ging iets mis bij het aanroepen van Ollama:")
            print(e)

        doorgaan = input("\nNog een test doen? (y/n): ").strip().lower()
        if doorgaan != "y":
            break

    print("\nTot de volgende keer!")


if __name__ == "__main__":
    run_cli()

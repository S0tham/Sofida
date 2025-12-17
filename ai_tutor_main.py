"""
AI Tutor voor Engels HAVO 5
Versie 1.1 - Grammatica, Schrijven, Lezen
Met: Ollama (mistral:7b), LLM-antwoordcheck, vloeiendere gespreksflow, meerdere oefeningen per keer.
"""

import json
import random
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import uuid
from dataclasses import dataclass, field


# ============================================================================
# CONFIGURATIE & ENUMS
# ============================================================================

class OefeningType(Enum):
    GRAMMATICA_GAPFILL = "grammatica_gapfill"
    GRAMMATICA_MEERKEUZE = "grammatica_meerkeuze"
    GRAMMATICA_TRANSFORMATIE = "grammatica_transformatie"
    SCHRIJVEN_EMAIL = "schrijven_email"
    SCHRIJVEN_ARTIKEL = "schrijven_artikel"
    SCHRIJVEN_REVIEW = "schrijven_review"
    LEZEN_HOOFDGEDACHTE = "lezen_hoofdgedachte"
    LEZEN_DETAIL = "lezen_detail"
    LEZEN_WOORDBETEKENIS = "lezen_woordbetekenis"
    LEZEN_TEKSTVERBAND = "lezen_tekstverband"
    LEZEN_HOUDING = "lezen_houding"


class Moeilijkheidsgraad(Enum):
    MAKKELIJK = 1
    GEMIDDELD = 2
    MOEILIJK = 3


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Oefening:
    type: OefeningType
    moeilijkheid: Moeilijkheidsgraad
    onderwerp: str
    instructie: str
    content: str
    juist_antwoord: str
    opties: Optional[List[str]] = None
    uitleg: Optional[str] = None
    id: str = field(default_factory=lambda: f"ex_{uuid.uuid4().hex[:8]}")



@dataclass
class StudentAntwoord:
    oefening_id: str
    antwoord: str
    is_correct: bool
    feedback: str


# ============================================================================
# TUTOR PERSOONLIJKHEDEN (met Promptstacking)
# ============================================================================

class TutorPersoonlijkheid:
    def __init__(self, naam: str, rol: str, gedrag: str, regels: str):
        self.naam = naam
        self.rol = rol
        self.gedrag = gedrag
        self.regels = regels

    def genereer_systeem_prompt(self, context_lengte: int = 3) -> str:
        """Genereert gestackte systeem prompt"""
        return f"""[ROL]
{self.rol}

[GEDRAG]
{self.gedrag}

[REGELS]
{self.regels}
- Onthoud de laatste {context_lengte} interacties voor context.
- Antwoord altijd in het Nederlands, behalve bij Engelse voorbeelden.
- Geef geen interne overwegingen weer.
"""


class TutorPersonaliteiten:
    @staticmethod
    def meester_jan():
        return TutorPersoonlijkheid(
            naam="Meester Jan",
            rol="""Je bent Meester Jan, een ervaren Engels docent voor HAVO 5 leerlingen.
Je hebt 15 jaar ervaring en bent specialist in examenvoorbereiding.
Je taak is om leerlingen te begeleiden bij grammatica, schrijven en lezen voor het centrale examen.""",
            gedrag="""Je bent geduldig, enthousiast en bemoedigend.
Je gebruikt positieve versterking en geeft altijd eerst complimenten voordat je verbeterpunten noemt.
Je legt moeilijke concepten uit met concrete voorbeelden en vergelijkingen.
Je toon is warm en toegankelijk, als een ervaren leraar die echt om zijn leerlingen geeft.
Je gebruikt af en toe Nederlandse humor om de sfeer luchtig te houden.
Bij fouten vraag je eerst door met vragen zoals "Weet je zeker dat dit klopt?" voordat je de oplossing geeft.""",
            regels="""- Geef altijd eerst positieve feedback, dan verbeterpunten
- Gebruik concrete voorbeelden bij uitleg
- Vraag door bij fouten voordat je de oplossing geeft
- Houd feedback beknopt (max 5-6 zinnen)
- Gebruik bemoedigende taal"""
        )

    @staticmethod
    def coach_sara():
        return TutorPersoonlijkheid(
            naam="Coach Sara",
            rol="""Je bent Coach Sara, een dynamische Engels coach voor HAVO 5 leerlingen.
Je bent jong, energiek en gebruikt moderne didactische methoden.
Je taak is om leerlingen uitdagend en effectief voor te bereiden op hun examen.""",
            gedrag="""Je bent direct, eerlijk en resultaatgericht.
Je geeft heldere, to-the-point feedback zonder omhaal.
Je gebruikt korte, krachtige zinnen en moedigt zelfstandig denken aan.
Je toon is vriendelijk maar professioneel, als een personal trainer voor taal.
Je daagt leerlingen uit met vragen als "Waarom denk je dat?" en "Wat is de regel hier?"
Bij fouten benoem je direct wat er mis is en leg je uit hoe het beter kan.""",
            regels="""- Wees direct en helder in feedback
- Benoem fouten expliciet met uitleg
- Gebruik korte, krachtige zinnen
- Daag uit met waarom-vragen
- Houd feedback actionable (max 4-5 zinnen)
- Focus op de regel/het principe achter de fout"""
        )


# ============================================================================
# LLM INTERFACE (Ollama - mistral7:b)
# ============================================================================

class LLMInterface:
    """
    Interface naar Ollama (lokale LLM).
    Verwacht dat Ollama draait en model 'mistral7:b' beschikbaar is.
    """

    def __init__(self, model: str = "mistral:7b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url

    def genereer_response(self, prompt: str, temperature: float = 0.3) -> str:
        """
        Genereert response via Ollama.
        Probeert eerst /api/generate, valt terug op /generate.
        Gebruikt streaming en plakt alle 'response'-chunks aan elkaar.
        """
        try:
            import requests
            import json

            endpoints = ["/api/generate", "/generate"]
            last_error = None

            for endpoint in endpoints:
                try:
                    response = requests.post(
                        f"{self.base_url}{endpoint}",
                        json={
                            "model": self.model,
                            "prompt": prompt,
                            "temperature": temperature,
                            # laat stream-gedrag aan Ollama zelf; wij lezen als stream
                        },
                        stream=True,
                        timeout=120,
                    )

                    # Als deze endpoint niet bestaat, probeer de volgende
                    if response.status_code == 404:
                        last_error = f"HTTP 404 op {endpoint}"
                        continue

                    if response.status_code != 200:
                        last_error = f"HTTP {response.status_code} op {endpoint}"
                        continue

                    chunks = []

                    for line in response.iter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line.decode("utf-8"))
                        except json.JSONDecodeError:
                            # Soms komt er rommel of lege regels tussendoor, negeren
                            continue

                        piece = data.get("response", "")
                        if piece:
                            chunks.append(piece)

                        if data.get("done"):
                            break

                    tekst = "".join(chunks).strip()
                    if tekst:
                        return tekst
                    else:
                        last_error = f"Lege response op {endpoint}"
                        continue

                except Exception as e:
                    last_error = str(e)
                    continue

            # Als beide endpoints falen of niks opleveren:
            if last_error:
                return f"[LLM Response Placeholder - Mislukte Ollama-call] {last_error}"
            return "[LLM gaf geen inhoudelijke response terug]"

        except Exception as e:
            return f"[LLM Response Placeholder - Mislukte Ollama-call]\nError: {str(e)}"



    def check_antwoord(self, oefening: Oefening, student_antwoord: str) -> Tuple[bool, str]:
        """
        LLM-gebaseerde controle:
        Geeft (is_correct: bool, oordeel: 'CORRECT' | 'BIJNA' | 'INCORRECT')
        """
        # Voor de LLM: strikt formaat afdwingen
        prompt = f"""
Je bent een nauwkeurige nakijk-assistent voor Engels HAVO 5.

Beoordeel of het antwoord van de leerling inhoudelijk overeenkomt met het juiste antwoord.

Let op:
- Kleine variaties in formulering / hoofdletters / lidwoorden / volgorde zijn toegestaan.
- Bij multiple choice is het antwoord correct als het overeenkomt met de juiste optie.
- Bij invuloefeningen gaat het om de juiste vorm en volgorde.
- 'BIJNA' gebruik je als het antwoord bijna goed is (kleine fout, maar regel grotendeels goed toegepast).

Geef je oordeel ALLEEN als één van deze drie woorden, in hoofdletters:
CORRECT
BIJNA
INCORRECT

Oefening:
Type: {oefening.type.value}
Onderwerp: {oefening.onderwerp}
Vraag/Opdracht: {oefening.content}
Juiste antwoord: {oefening.juist_antwoord}

Antwoord leerling: {student_antwoord}

Jouw oordeel:
"""
        resultaat = self.genereer_response(prompt, temperature=0.0).strip().upper()

        if "CORRECT" in resultaat and "BIJNA" not in resultaat and "INCORRECT" not in resultaat:
            return True, "CORRECT"
        if "BIJNA" in resultaat:
            return False, "BIJNA"
        if "INCORRECT" in resultaat or not resultaat:
            return False, "INCORRECT"

        # Fallback als model iets geks doet
        return False, "INCORRECT"


# ============================================================================
# OEFENINGEN GENERATOR
# ============================================================================

class OefeningenGenerator:
    def __init__(self):
        self.grammatica_onderwerpen = {
            "present_simple": {"naam": "Present Simple", "moeilijkheid": Moeilijkheidsgraad.MAKKELIJK},
            "present_continuous": {"naam": "Present Continuous", "moeilijkheid": Moeilijkheidsgraad.MAKKELIJK},
            "past_simple": {"naam": "Past Simple", "moeilijkheid": Moeilijkheidsgraad.MAKKELIJK},
            "present_perfect": {"naam": "Present Perfect", "moeilijkheid": Moeilijkheidsgraad.GEMIDDELD},
            "conditionals": {"naam": "Conditionals (0,1,2,3)", "moeilijkheid": Moeilijkheidsgraad.MOEILIJK},
            "passive_voice": {"naam": "Passive Voice", "moeilijkheid": Moeilijkheidsgraad.MOEILIJK},
            "relative_clauses": {"naam": "Relative Clauses", "moeilijkheid": Moeilijkheidsgraad.GEMIDDELD},
            "reported_speech": {"naam": "Reported Speech", "moeilijkheid": Moeilijkheidsgraad.MOEILIJK},
            "modals": {"naam": "Modal Verbs", "moeilijkheid": Moeilijkheidsgraad.GEMIDDELD},
            "future_forms": {"naam": "Future Forms", "moeilijkheid": Moeilijkheidsgraad.GEMIDDELD},
        }

    def genereer_grammatica_gapfill(self, onderwerp: str) -> Oefening:
        """Genereert één gap-fill oefening"""
        templates = {
            "present_simple": [
                ("She ___ (work) at a hospital every day.", "works",
                 "Present Simple: bij he/she/it voeg je -s toe."),
                ("They ___ (not/like) vegetables.", "don't like",
                 "Present Simple ontkenning: don't + infinitive."),
                ("___ you ___ (speak) English?", "Do / speak",
                 "Present Simple vraag: Do/Does + subject + infinitive."),
            ],
            "present_perfect": [
                ("I ___ (live) here for five years.", "have lived",
                 "Present Perfect: have/has + past participle voor duratie."),
                ("She ___ (already/finish) her homework.", "has already finished",
                 "Present Perfect: has + past participle."),
                ("They ___ (not/see) that movie yet.", "haven't seen",
                 "Present Perfect ontkenning: haven't/hasn't + past participle."),
            ],
            "conditionals": [
                ("If it ___ (rain) tomorrow, we will stay home.", "rains",
                 "First Conditional: if + present simple, will + infinitive."),
                ("If I ___ (be) rich, I would travel the world.", "were",
                 "Second Conditional: if + past simple, would + infinitive."),
                ("If she ___ (study) harder, she would have passed.", "had studied",
                 "Third Conditional: if + past perfect, would have + past participle."),
            ],
            "passive_voice": [
                ("The book ___ (write) by Shakespeare.", "was written",
                 "Passive past: was/were + past participle."),
                ("English ___ (speak) all over the world.", "is spoken",
                 "Passive present: am/is/are + past participle."),
                ("The house ___ (build) next year.", "will be built",
                 "Passive future: will be + past participle."),
            ],
        }

        if onderwerp not in templates:
            onderwerp = random.choice(list(templates.keys()))

        template_data = random.choice(templates[onderwerp])
        info = self.grammatica_onderwerpen.get(onderwerp, {
            "naam": onderwerp,
            "moeilijkheid": Moeilijkheidsgraad.GEMIDDELD
        })

        return Oefening(
            type=OefeningType.GRAMMATICA_GAPFILL,
            moeilijkheid=info["moeilijkheid"],
            onderwerp=info["naam"],
            instructie=f"Vul de juiste vorm van het werkwoord in tussen haakjes. Onderwerp: {info['naam']}.",
            content=template_data[0],
            juist_antwoord=template_data[1],
            uitleg=template_data[2]
        )

    def genereer_grammatica_meerkeuze(self, onderwerp: str) -> Oefening:
        """Genereert één meerkeuze oefening"""
        vragen = {
            "modals": [
                {
                    "vraag": "You ___ wear a seatbelt in a car. It's the law.",
                    "opties": ["must", "should", "can", "might"],
                    "correct": "must",
                    "uitleg": "Must = verplichting/wet. Should = advies."
                },
                {
                    "vraag": "She ___ speak three languages fluently.",
                    "opties": ["can", "must", "should", "would"],
                    "correct": "can",
                    "uitleg": "Can = kunnen/bekwaamheid."
                },
            ],
            "relative_clauses": [
                {
                    "vraag": "The man ___ lives next door is a doctor.",
                    "opties": ["who", "which", "where", "whose"],
                    "correct": "who",
                    "uitleg": "Who = personen."
                },
                {
                    "vraag": "This is the house ___ I grew up.",
                    "opties": ["where", "which", "who", "when"],
                    "correct": "where",
                    "uitleg": "Where = plaatsen."
                },
            ],
        }

        if onderwerp not in vragen:
            onderwerp = random.choice(list(vragen.keys()))

        vraag_data = random.choice(vragen[onderwerp])
        info = self.grammatica_onderwerpen.get(onderwerp, {
            "naam": onderwerp,
            "moeilijkheid": Moeilijkheidsgraad.GEMIDDELD
        })

        return Oefening(
            type=OefeningType.GRAMMATICA_MEERKEUZE,
            moeilijkheid=info["moeilijkheid"],
            onderwerp=info["naam"],
            instructie=f"Kies het juiste woord. Onderwerp: {info['naam']}.",
            content=vraag_data["vraag"],
            juist_antwoord=vraag_data["correct"],
            opties=vraag_data["opties"],
            uitleg=vraag_data["uitleg"]
        )

    def genereer_lezen_oefening(self, subtype: str) -> Oefening:
        """Genereert één leesoefening"""
        teksten = {
            "hoofdgedachte": {
                "tekst": """Social media has transformed how we communicate, but not everyone agrees this is positive.
While platforms like Instagram and TikTok allow instant connection with friends worldwide, critics argue
they create superficial relationships. Studies show teenagers spend an average of 7 hours daily on their
phones, raising concerns about mental health. However, supporters point out these platforms enable
creative expression and community building that wasn't possible before.""",
                "vraag": "Wat is de hoofdgedachte van deze tekst?",
                "opties": [
                    "Social media is uitsluitend negatief voor jongeren",
                    "Social media heeft zowel positieve als negatieve aspecten",
                    "Jongeren moeten meer tijd op social media doorbrengen",
                    "Social media helpt alleen bij creatieve expressie"
                ],
                "correct": "Social media heeft zowel positieve als negatieve aspecten",
                "uitleg": "De tekst laat zowel voordelen als nadelen zien."
            },
            "detail": {
                "tekst": """The new recycling program in Amsterdam starts on January 15th. Residents must separate
plastic, paper, and glass into different colored bins: blue for paper, green for glass, and yellow for
plastic. The collection happens every Tuesday morning before 7 AM. Items not properly sorted will not be
collected and residents may face a €50 fine.""",
                "vraag": "Wat gebeurt er als bewoners hun afval niet goed scheiden?",
                "opties": [
                    "Ze krijgen een waarschuwing",
                    "Hun afval wordt niet opgehaald en ze kunnen een boete krijgen",
                    "Ze moeten zelf naar de vuilstort",
                    "Er gebeurt niets"
                ],
                "correct": "Hun afval wordt niet opgehaald en ze kunnen een boete krijgen",
                "uitleg": "Staat expliciet in de laatste zin."
            },
            "woordbetekenis": {
                "tekst": """The concert was absolutely stunning. The lead singer's voice was mesmerizing,
and the light show was spectacular. Everyone in the audience was captivated from start to finish.""",
                "vraag": "Wat betekent 'stunning' in deze context?",
                "opties": [
                    "Vervelend en saai",
                    "Indrukwekkend en prachtig",
                    "Luid en storend",
                    "Kort en eenvoudig"
                ],
                "correct": "Indrukwekkend en prachtig",
                "uitleg": "Context is zeer positief."
            },
            "tekstverband": {
                "tekst": """Many students struggle with time management. Therefore, learning to prioritize tasks
can significantly improve academic performance. Creating a weekly schedule helps students balance
homework, sports, and social activities.""",
                "vraag": "Welk signaalwoord (zoals 'therefore') geeft hier een gevolg aan?",
                "opties": ["Therefore", "However", "Although", "Besides"],
                "correct": "Therefore",
                "uitleg": "Geeft een logisch gevolg aan."
            },
            "houding": {
                "tekst": """While some argue that homework is essential for learning, I find this view outdated.
Research clearly shows that excessive homework causes stress without improving grades. Schools should
focus on quality over quantity and give students time to develop other skills.""",
                "vraag": "Wat is de houding van de schrijver ten opzichte van huiswerk?",
                "opties": [
                    "Neutraal en objectief",
                    "Kritisch en tegen veel huiswerk",
                    "Positief en ondersteunend",
                    "Onzeker en twijfelend"
                ],
                "correct": "Kritisch en tegen veel huiswerk",
                "uitleg": "Woorden als 'outdated' en 'should' tonen kritiek."
            }
        }

        if subtype not in teksten:
            subtype = random.choice(list(teksten.keys()))

        data = teksten[subtype]
        type_map = {
            "hoofdgedachte": OefeningType.LEZEN_HOOFDGEDACHTE,
            "detail": OefeningType.LEZEN_DETAIL,
            "woordbetekenis": OefeningType.LEZEN_WOORDBETEKENIS,
            "tekstverband": OefeningType.LEZEN_TEKSTVERBAND,
            "houding": OefeningType.LEZEN_HOUDING,
        }

        return Oefening(
            type=type_map[subtype],
            moeilijkheid=Moeilijkheidsgraad.GEMIDDELD,
            onderwerp=f"Lezen - {subtype.capitalize()}",
            instructie="Lees de tekst en beantwoord de vraag.",
            content=f"{data['tekst']}\n\n{data['vraag']}",
            juist_antwoord=data["correct"],
            opties=data["opties"],
            uitleg=data["uitleg"]
        )

    def genereer_schrijven_oefening(self, tekstsoort: str) -> Oefening:
        """Genereert één schrijfoefening"""
        opdrachten = {
            "email_informeel": {
                "instructie": """Schrijf een informele e-mail (80-100 woorden) aan je Engelse vriend Tom.
Vertel hem over je plannen voor de zomervakantie. Vermeld:
- Waar je heen gaat
- Met wie je gaat
- Wat je van plan bent te doen
- Vraag ook naar zijn plannen.""",
                "rubric": {
                    "structuur": "Opening en afsluiting aanwezig.",
                    "inhoud": "Alle punten behandeld.",
                    "taal": "Informele toon, juiste tijden.",
                    "lengte": "80-100 woorden."
                }
            },
            "email_formeel": {
                "instructie": """Schrijf een formele e-mail (100-120 woorden) aan de manager van een hotel.
Je verbleef er vorige week, maar er waren problemen. Vermeld:
- Wanneer je verbleef
- Wat de problemen waren
- Wat je verwacht (excuses/compensatie)
Gebruik formele taal.""",
                "rubric": {
                    "structuur": "Formele aanhef/afsluiting.",
                    "inhoud": "Probleem + verwachting duidelijk.",
                    "taal": "Formeel, beleefd.",
                    "lengte": "100-120 woorden."
                }
            },
            "artikel": {
                "instructie": """Schrijf een artikel (120-150 woorden) voor de schoolkrant:
"Should schools ban smartphones during lessons?"
Geef je mening met argumenten.""",
                "rubric": {
                    "structuur": "Inleiding, 2-3 argumenten, conclusie.",
                    "inhoud": "Duidelijk standpunt.",
                    "taal": "Signaalwoorden gebruiken.",
                    "lengte": "120-150 woorden."
                }
            }
        }

        if tekstsoort not in opdrachten:
            tekstsoort = random.choice(list(opdrachten.keys()))

        data = opdrachten[tekstsoort]
        type_map = {
            "email_informeel": OefeningType.SCHRIJVEN_EMAIL,
            "email_formeel": OefeningType.SCHRIJVEN_EMAIL,
            "artikel": OefeningType.SCHRIJVEN_ARTIKEL,
        }

        return Oefening(
            type=type_map[tekstsoort],
            moeilijkheid=Moeilijkheidsgraad.GEMIDDELD,
            onderwerp=f"Schrijven - {tekstsoort.replace('_', ' ').title()}",
            instructie=data["instructie"],
            content=json.dumps(data["rubric"], ensure_ascii=False),
            juist_antwoord="",
            uitleg=f"Beoordeling op: {', '.join(data['rubric'].keys())}."
        )


# ============================================================================
# FEEDBACK GENERATOR
# ============================================================================

class FeedbackGenerator:
    def __init__(self, tutor: TutorPersoonlijkheid, llm: LLMInterface):
        self.tutor = tutor
        self.llm = llm

    def genereer_feedback(self, oefening: Oefening, student_antwoord: str, is_correct: bool) -> str:
        """Genereert gepersonaliseerde feedback via LLM"""
        feedback_prompt = f"""{self.tutor.genereer_systeem_prompt(context_lengte=1)}

## Huidige Situatie
Oefening Type: {oefening.type.value}
Onderwerp: {oefening.onderwerp}
Vraag/Opdracht: {oefening.content}

Antwoord leerling: {student_antwoord}
Correct antwoord: {oefening.juist_antwoord}
Is correct: {'Ja' if is_correct else 'Nee'}

Uitleg bij het antwoord: {oefening.uitleg if oefening.uitleg else 'Geen specifieke uitleg beschikbaar.'}

## Jouw Taak
Geef feedback volgens jouw persoonlijkheid.
{ "Complimenteer de leerling en moedig aan om door te gaan." if is_correct else "Leg kort uit wat er misgaat en hoe het beter kan. Blijf bemoedigend." }

Schrijf 3-5 zinnen in het Nederlands.
"""
        return self.llm.genereer_response(feedback_prompt, temperature=0.4)

    def genereer_schrijf_feedback(self, oefening: Oefening, student_tekst: str) -> str:
        """Genereert feedback op schrijfopdracht"""
        rubric = json.loads(oefening.content)

        feedback_prompt = f"""{self.tutor.genereer_systeem_prompt(context_lengte=1)}

## Schrijfopdracht
Opdracht:
{oefening.instructie}

Tekst van leerling:
{student_tekst}

Beoordelingscriteria:
{json.dumps(rubric, indent=2, ensure_ascii=False)}

## Jouw Taak
Geef concrete feedback per criterium:
- Structuur
- Inhoud
- Taalgebruik (grammatica, register, signaalwoorden)
- Lengte

Wees specifiek, kort en behulpzaam (5-8 zinnen).
"""
        return self.llm.genereer_response(feedback_prompt, temperature=0.4)


# ============================================================================
# PROGRESS TRACKER
# ============================================================================

class ProgressTracker:
    def __init__(self):
        self.geschiedenis: List[Dict] = []
        self.fouten_per_onderwerp: Dict[str, int] = {}

    def registreer_oefening(self, oefening: Oefening, is_correct: bool, student_antwoord: str):
        self.geschiedenis.append({
            "type": oefening.type.value,
            "onderwerp": oefening.onderwerp,
            "correct": is_correct,
            "antwoord": student_antwoord
        })
        if not is_correct:
            self.fouten_per_onderwerp[oefening.onderwerp] = self.fouten_per_onderwerp.get(oefening.onderwerp, 0) + 1

    def get_zwakke_punten(self) -> List[str]:
        if not self.fouten_per_onderwerp:
            return []
        gesorteerd = sorted(self.fouten_per_onderwerp.items(), key=lambda x: x[1], reverse=True)
        return [onderwerp for onderwerp, _ in gesorteerd[:3]]

    def get_statistieken(self) -> Dict:
        if not self.geschiedenis:
            return {"totaal": 0, "correct": 0, "percentage": 0.0}
        totaal = len(self.geschiedenis)
        correct = sum(1 for item in self.geschiedenis if item["correct"])
        return {
            "totaal": totaal,
            "correct": correct,
            "percentage": round((correct / totaal) * 100, 1)
        }


# ============================================================================
# MAIN TUTOR SYSTEEM
# ============================================================================

class AITutorSysteem:
    def __init__(self, tutor_naam: str = "meester_jan", context_lengte: int = 3):
        if tutor_naam == "meester_jan":
            self.tutor = TutorPersonaliteiten.meester_jan()
        else:
            self.tutor = TutorPersonaliteiten.coach_sara()

        self.context_lengte = context_lengte
        self.generator = OefeningenGenerator()
        self.llm = LLMInterface()
        self.feedback_gen = FeedbackGenerator(self.tutor, self.llm)
        self.progress = ProgressTracker()
        self.huidige_oefening: Optional[Oefening] = None
        self.conversatie_geschiedenis: List[Dict] = []

    def start_sessie(self) -> str:
        prompt = f"""{self.tutor.genereer_systeem_prompt(self.context_lengte)}

## Situatie
Een nieuwe HAVO 5 leerling start een sessie met jou.

## Jouw Taak
Begroet de leerling kort.
Stel jezelf voor (naam en rol).
Leg kort uit waarmee je kunt helpen (grammatica, schrijven, lezen).
Vraag wat de leerling vandaag wil oefenen of beter begrijpen.

Max 4-5 zinnen.
"""
        begroeting = self.llm.genereer_response(prompt, temperature=0.6)
        self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": begroeting})
        return begroeting

    def genereer_verduidelijkingsvraag(self, categorie: str) -> str:
        """Laat de tutor in gesprek vragen wat precies geoefend/uitgelegd moet worden."""
        prompt = f"""{self.tutor.genereer_systeem_prompt(self.context_lengte)}

## Situatie
De leerling heeft gekozen voor: {categorie}.

## Jouw Taak
Stel in 1-2 zinnen een vraag waarin je:
- vraagt of de leerling uitleg wil of oefeningen,
- vraagt over welk onderwerp binnen {categorie} hij/zij wil werken.
Maak het concreet (bijv. tenses, conditionals, tekstsoort, soort leesvraag).

Antwoord alleen met de vraag in het Nederlands.
"""
        vraag = self.llm.genereer_response(prompt, temperature=0.6)
        self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": vraag})
        return vraag

    def _detect_uitleg(self, keuze_tekst: str) -> bool:
        tekst = keuze_tekst.lower()
        return any(w in tekst for w in ["uitleg", "leg uit", "begrijpen", "snap", "weet niet hoe"])

    def _kies_grammatica_onderwerp(self, keuze_tekst: str) -> str:
        tekst = keuze_tekst.lower()
        for key, data in self.generator.grammatica_onderwerpen.items():
            naam = data["naam"].lower()
            if key.replace("_", " ") in tekst or naam.split()[0] in tekst or naam in tekst:
                return key
        return random.choice(list(self.generator.grammatica_onderwerpen.keys()))

    def genereer_uitleg(self, categorie: str, keuze_tekst: str) -> str:
        """Genereert korte uitleg op basis van keuze (i.p.v. oefening)."""
        prompt = f"""{self.tutor.genereer_systeem_prompt(self.context_lengte)}

## Situatie
De leerling zegt: "{keuze_tekst}"
Categorie: {categorie}

## Jouw Taak
Geef een duidelijke, korte uitleg (4-7 zinnen) op HAVO 5-niveau over het gevraagde onderwerp.
- Gebruik Nederlands voor uitleg.
- Gebruik Engelse voorbeeldzinnen.
- Sluit af met een kleine opdracht of vraag (bijv. 'Maak nu zelf 2 zinnen...').

"""
        uitleg = self.llm.genereer_response(prompt, temperature=0.5)
        self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": uitleg})
        return uitleg

    def genereer_oefeningen_op_basis_van_keuze(
        self,
        categorie: str,
        keuze_tekst: str,
        aantal: int = 3
    ) -> Tuple[List[Oefening], str]:
        """
        Maakt op basis van de vrije input van de leerling:
        - meerdere oefeningen (lijst),
        - plus een korte introductietekst door de tutor.
        """

        # Eerst checken of de leerling om uitleg vraagt
        if self._detect_uitleg(keuze_tekst):
            uitleg = self.genereer_uitleg(categorie, keuze_tekst)
            return [], uitleg

        oefeningen: List[Oefening] = []

        if categorie == "grammatica":
            onderwerp_key = self._kies_grammatica_onderwerp(keuze_tekst)
            # mix van gapfill en meerkeuze
            for i in range(aantal):
                if i % 2 == 0:
                    oefeningen.append(self.generator.genereer_grammatica_gapfill(onderwerp_key))
                else:
                    oefeningen.append(self.generator.genereer_grammatica_meerkeuze(onderwerp_key))

        elif categorie == "lezen":
            subtypes = ["hoofdgedachte", "detail", "woordbetekenis", "tekstverband", "houding"]
            for _ in range(min(aantal, 3)):
                subtype = random.choice(subtypes)
                oefeningen.append(self.generator.genereer_lezen_oefening(subtype))

        elif categorie == "schrijven":
            # Kies tekstsoort op basis van keuze of random
            tekstsoort = "artikel"
            lower = keuze_tekst.lower()
            if "formeel" in lower or "complaint" in lower or "klacht" in lower:
                tekstsoort = "email_formeel"
            elif "mail" in lower or "vriend" in lower or "informele" in lower:
                tekstsoort = "email_informeel"
            oefeningen.append(self.generator.genereer_schrijven_oefening(tekstsoort))

        else:  # willekeurig
            # simpele mix
            oefeningen.append(self.generator.genereer_grammatica_gapfill(self._kies_grammatica_onderwerp(keuze_tekst)))
            oefeningen.append(self.generator.genereer_lezen_oefening("detail"))

        # Intro via LLM
        beschrijving = f"{categorie} - gebaseerd op: '{keuze_tekst}'"
        prompt = f"""{self.tutor.genereer_systeem_prompt(self.context_lengte)}

## Situatie
Je gaat de leerling meerdere oefeningen geven.

Samenvatting keuze leerling: "{keuze_tekst}"
Categorie: {categorie}
Aantal oefeningen: {len(oefeningen)}

## Jouw Taak
Leg in 2-3 zinnen uit wat jullie nu gaan doen.
Wees motiverend en duidelijk.

"""
        intro = self.llm.genereer_response(prompt, temperature=0.6)
        self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": intro})

        return oefeningen, intro

    def controleer_antwoord(self, oefening: Oefening, student_antwoord: str) -> Tuple[bool, str]:
        """Controle met LLM-check + feedback."""
        if not oefening:
            return False, "Er is momenteel geen actieve oefening."

        # Schrijfopdrachten → altijd via schrijf-feedback
        if oefening.type in [OefeningType.SCHRIJVEN_EMAIL, OefeningType.SCHRIJVEN_ARTIKEL, OefeningType.SCHRIJVEN_REVIEW]:
            feedback = self.feedback_gen.genereer_schrijf_feedback(oefening, student_antwoord)
            self.progress.registreer_oefening(oefening, True, student_antwoord)
            self.conversatie_geschiedenis.append({"rol": "student", "bericht": student_antwoord})
            self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": feedback})
            return True, feedback

        # Gesloten vragen → LLM-based check
        is_correct, oordeel = self.llm.check_antwoord(oefening, student_antwoord)
        feedback = self.feedback_gen.genereer_feedback(oefening, student_antwoord, is_correct)

        self.progress.registreer_oefening(oefening, is_correct, student_antwoord)
        self.conversatie_geschiedenis.append({"rol": "student", "bericht": student_antwoord})
        self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": feedback})

        return is_correct, feedback

    def toon_statistieken(self) -> str:
        stats = self.progress.get_statistieken()
        zwakke_punten = self.progress.get_zwakke_punten()

        prompt = f"""{self.tutor.genereer_systeem_prompt(self.context_lengte)}

## Situatie
De leerling vraagt om een overzicht van de voortgang.

Statistieken:
- Totaal oefeningen: {stats['totaal']}
- Correct: {stats['correct']}
- Score: {stats['percentage']}%
Zwakke punten: {', '.join(zwakke_punten) if zwakke_punten else 'Nog geen duidelijke zwakke punten.'}

## Jouw Taak
Leg dit kort en bemoedigend uit (4-5 zinnen).
Geef 1-2 concrete tips waar de leerling zich op kan richten.

"""
        presentatie = self.llm.genereer_response(prompt, temperature=0.5)
        self.conversatie_geschiedenis.append({"rol": "tutor", "bericht": presentatie})
        return presentatie

    def wissel_tutor(self, nieuwe_tutor: str):
        if nieuwe_tutor == "meester_jan":
            self.tutor = TutorPersonaliteiten.meester_jan()
        else:
            self.tutor = TutorPersonaliteiten.coach_sara()
        self.feedback_gen = FeedbackGenerator(self.tutor, self.llm)

    def get_conversatie_context(self, laatste_n: int = None) -> str:
        if laatste_n is None:
            laatste_n = self.context_lengte
        relevante = self.conversatie_geschiedenis[-laatste_n:] if laatste_n > 0 else []
        context = ""
        for b in relevante:
            rol = "Tutor" if b["rol"] == "tutor" else "Leerling"
            context += f"{rol}: {b['bericht']}\n\n"
        return context


# ============================================================================
# COMMAND LINE INTERFACE (voor testing)
# ============================================================================

class TutorCLI:
    def __init__(self):
        self.systeem: Optional[AITutorSysteem] = None

    def run(self):
        print("=== AI Tutor voor Engels HAVO 5 ===\n")
        print("Welke tutor wil je?")
        print("1. Meester Jan (geduldig, warm, bemoedigend)")
        print("2. Coach Sara (direct, resultaatgericht, uitdagend)")

        keuze = input("\nKies (1 of 2): ").strip()
        tutor_naam = "meester_jan" if keuze == "1" else "coach_sara"

        print("\nHoeveel eerdere interacties mag de tutor ongeveer meenemen? (1-10)")
        context = input("Context lengte [standaard 3]: ").strip()
        context_lengte = int(context) if context.isdigit() and 1 <= int(context) <= 10 else 3

        self.systeem = AITutorSysteem(tutor_naam=tutor_naam, context_lengte=context_lengte)

        print("\n" + "=" * 60)
        begroeting = self.systeem.start_sessie()
        print(f"\n{begroeting}\n")

        self.main_loop()

    def main_loop(self):
        while True:
            print("\n" + "-" * 60)
            print("Wat wil je doen?")
            print("1. Grammatica")
            print("2. Lezen")
            print("3. Schrijven")
            print("4. Willekeurig")
            print("5. Toon mijn voortgang")
            print("6. Wissel van tutor")
            print("7. Stop")

            keuze = input("\nKies (1-7): ").strip()

            if keuze == "7":
                print("\nBedankt voor het oefenen! Tot de volgende keer.")
                break

            if keuze == "5":
                print("\n" + "=" * 60)
                stats = self.systeem.toon_statistieken()
                print(f"\n{stats}\n")
                continue

            if keuze == "6":
                print("\n1. Meester Jan")
                print("2. Coach Sara")
                nieuwe_keuze = input("Wissel naar (1 of 2): ").strip()
                nieuwe_tutor = "meester_jan" if nieuwe_keuze == "1" else "coach_sara"
                self.systeem.wissel_tutor(nieuwe_tutor)
                print(f"\nGewisseld naar {self.systeem.tutor.naam}!\n")
                continue

            categorie_map = {
                "1": "grammatica",
                "2": "lezen",
                "3": "schrijven",
                "4": "willekeurig"
            }
            categorie = categorie_map.get(keuze, "willekeurig")

            print("\n" + "=" * 60)
            vraag = self.systeem.genereer_verduidelijkingsvraag(categorie)
            print(f"\n{vraag}\n")
            keuze_tekst = input("Jij: ").strip()

            if not keuze_tekst:
                print("\nGeen invoer ontvangen. Probeer opnieuw.")
                continue

            oefeningen, intro = self.systeem.genereer_oefeningen_op_basis_van_keuze(
                categorie,
                keuze_tekst,
                aantal=3  # hier kun je later dynamisch van maken
            )

            print("\n" + "=" * 60)
            print(f"\n{intro}\n")

            # Als er geen oefeningen zijn, was het een uitleg
            if not oefeningen:
                continue

            # Loop door meerdere oefeningen
            for idx, oef in enumerate(oefeningen, start=1):
                self.systeem.huidige_oefening = oef
                print("\n" + "-" * 40)
                print(f"Oefening {idx}")
                print(f"📚 {oef.instructie}\n")
                print(f"❓ {oef.content}\n")

                if oef.opties:
                    print("Opties:")
                    for i, optie in enumerate(oef.opties, 1):
                        print(f"  {i}. {optie}")
                    print()

                # Antwoord van student
                if oef.type in [OefeningType.SCHRIJVEN_EMAIL, OefeningType.SCHRIJVEN_ARTIKEL, OefeningType.SCHRIJVEN_REVIEW]:
                    print("Typ je tekst (eindig met een lege regel):")
                    lines = []
                    while True:
                        line = input()
                        if line == "":
                            break
                        lines.append(line)
                    antwoord = "\n".join(lines)
                else:
                    antwoord = input("Jouw antwoord: ").strip()

                if not antwoord:
                    print("\nGeen antwoord gegeven voor deze oefening.")
                    continue

                print("\n" + "-" * 40)
                is_correct, feedback = self.systeem.controleer_antwoord(oef, antwoord)

                if oef.type not in [OefeningType.SCHRIJVEN_EMAIL, OefeningType.SCHRIJVEN_ARTIKEL, OefeningType.SCHRIJVEN_REVIEW]:
                    status = "✅ Correct!" if is_correct else "❌ Niet helemaal correct"
                    print(f"\n{status}\n")

                print(f"💬 {feedback}\n")


# ============================================================================
# VOORBEELD GEBRUIK ZONDER INTERACTIEVE CLI
# ============================================================================

def demo_zonder_cli():
    print("=== Demo AI Tutor Systeem ===\n")
    tutor = AITutorSysteem(tutor_naam="meester_jan", context_lengte=3)
    print("1. START SESSIE")
    print("-" * 50)
    print(tutor.start_sessie())

    print("\n2. GRAMMATICA KEUZE + OEFENINGEN")
    print("-" * 50)
    vraag = tutor.genereer_verduidelijkingsvraag("grammatica")
    print("Tutor:", vraag)
    keuze_tekst = "Ik wil oefenen met present perfect."
    oefeningen, intro = tutor.genereer_oefeningen_op_basis_van_keuze("grammatica", keuze_tekst, aantal=2)
    print("Tutor:", intro)
    for oef in oefeningen:
        print("\nOefening:", oef.instructie)
        print(oef.content)
        ok, fb = tutor.controleer_antwoord(oef, oef.juist_antwoord)
        print("Feedback:", fb)

    print("\n3. STATISTIEKEN")
    print("-" * 50)
    print(tutor.toon_statistieken())


if __name__ == "__main__":
    print("Kies modus:")
    print("1. Interactieve CLI")
    print("2. Demo zonder interactie")

    keuze = input("\nKeuze (1 of 2): ").strip()

    if keuze == "1":
        cli = TutorCLI()
        cli.run()
    else:
        demo_zonder_cli()

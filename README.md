# Sofida AI Tutor 🎓

**Sofida** is een interactieve, intelligente AI-tutor speciaal ontwikkeld voor HAVO 5 leerlingen. De applicatie helpt studenten met het vak Engels door middel van gepersonaliseerde begeleiding, oefeningen op maat en real-time spraakinteractie.

## 🚀 Features

* **Hybride Chat Systeem:**
    * 💬 **Tekst Chat:** Klassieke chatinterface met geschiedenis.
    * 🎙️ **Realtime Audio:** Spraak-naar-spraak interactie via WebSockets (OpenAI Realtime API) met Push-to-Talk functionaliteit.
* **Tutor Persoonlijkheden:**
    * 👨‍🏫 **Meester Jan:** Een geduldige, warme docent die stap-voor-stap uitlegt.
    * 👩‍🏫 **Coach Sara:** Een directe, resultaatgerichte coach die focust op examenvoorbereiding.
* **Oefeningen Generator:**
    * Genereert dynamisch oefeningen (Grammatica, Lezen, Schrijven, Woordenschat).
    * Kijkt antwoorden na en geeft constructieve feedback.
* **Visuele Feedback:** Realtime volume-detectie en statusindicatoren tijdens spraaksessies.

## 🏗️ Architectuur

Sofida maakt gebruik van een hybride architectuur waarbij HTTP-requests worden gebruikt voor tekst en oefeningen, en WebSockets voor de realtime audio-ervaring.

1. De "Chat Route" (Traag & Bedachtzaam) 🐢

Voor tekstberichten en het maken van oefeningen gebruiken we standaard web-verkeer (HTTP).

    Hoe het werkt: De student stuurt een bericht → De server denkt na (vraagt LLM) → De server stuurt antwoord terug.

    Gebruik: Chatten, Nakijken, Instellingen.

2. De "Bel Route" (Supersnel & Realtime) 🐇

Voor de spraakfunctie gebruiken we WebSockets. Dit is een permanente open lijn, vergelijkbaar met een telefoongesprek.

    Hoe het werkt: De server fungeert alleen als doorgeefluik (Relay). Audio van de student vliegt direct door naar OpenAI, en de stem van de AI vliegt direct terug naar de browser.

    Gebruik: Het telefoongesprek (Push-to-Talk).

graph TD
    subgraph Client [Frontend: React]
        UI[💬 Chat Interface]
        Mic[🎙️ Microfoon]
    end

    subgraph Server [Backend: FastAPI]
        API[HTTP API]
        Relay[WebSocket Relay]
    end

    subgraph Cloud [AI Services]
        LLM[🧠 LLM / Ollama]
        Realtime[⚡ OpenAI Realtime]
    end

    %% Route 1: Tekst
    UI -->|1. Tekst Bericht (HTTP)| API
    API -->|Prompt| LLM
    LLM -->|Antwoord| API

    %% Route 2: Audio
    Mic ==>|2. Audio Stream (WebSocket)| Relay
    Relay <==>|Tunnel| Realtime

## 🛠️ Tech Stack

**Frontend:**

    Framework: React (Vite)
    Language: TypeScript
    Styling: Tailwind CSS
    Icons: Lucide React
    Audio: Web Audio API 

**Backend:**

    Server: Python (FastAPI)
    Server Runner: Uvicorn
    Realtime: WebSockets
    AI Models: OpenAI (GPT-4o & Realtime Preview), ElevenLabs (Legacy TTS)

## ⚙️ Installatie & Setup

Volg deze stappen om het project lokaal te draaien.
1. Backend Setup

Ga naar de backend map:
# Installeer dependencies
pip install fastapi uvicorn websockets python-dotenv openai elevenlabs requests

# Start de server (draait op poort 8000)
uvicorn main:app --reload
2. Frontend Setup

Ga naar de frontend map:
# Installeer dependencies
npm install

# Start de frontend (draait meestal op poort 5173)
npm run dev
3. Environment Variabelen (.env)

Maak een .env bestand aan in de map van je main.py en voeg je sleutels toe:
OPENAI_API_KEY=sk-proj-jouw-openai-key...
ELEVENLABS_API_KEY=jouw-elevenlabs-key...
# Project Structuur

Een overzicht van de belangrijkste bestanden:
/src
  /components
    ├── ChatView.tsx          # Hoofdinterface (Chat & Audio UI)
    ├── TutorSettings.tsx     # Instellingen menu
    └── ...
  /hooks
    └── useRealtime.ts        # Custom hook voor WebSocket audio & mic management
  /api
    └── index.ts              # API calls (HTTP)
/
  ├── main.py                 # FastAPI server & WebSocket endpoint
  ├── tutor_personalities.py  # Definities voor Jan & Sara
  ├── exercise_generator.py   # Logica voor oefeningen
  └── ...
  ## Gebruik

    Starten: Open de applicatie in je browser.

    Kies een Tutor: Schakel tussen Meester Jan of Coach Sara via de knoppen bovenin.

    Tekst: Typ vragen of vraag om oefeningen in de chatbalk.

    Audio: Klik op het Telefoon-icoon rechtsboven.

        Wacht op verbinding.

        Spreek je vraag in.

        Klik op "Klaar, verstuur antwoord!" om je audio te verzenden.

## Bijdragen

Dit is een schoolproject voor Fontys.

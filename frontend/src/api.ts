// src/api.ts

// Zorg dat je Python backend draait op deze poort!
const API_BASE = "http://localhost:8000/api";

export interface Config {
  topic: string;
  difficulty: string;
  skill: string;
}

// Start een nieuwe sessie met Jan of Sara
export async function createSession(tutor: string, config: Config) {
  const res = await fetch(`${API_BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tutor, config }),
  });
  if (!res.ok) throw new Error("Kon sessie niet starten. Check of backend draait.");
  return res.json();
}

// Stuur een normaal chatbericht
export async function sendMessage(sessionId: string, message: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Kon bericht niet versturen.");
  return res.json();
}

// Vraag een nieuwe oefening aan
export async function requestExercise(sessionId: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/exercise`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Kon oefening niet ophalen.");
  return res.json();
}

// Stuur een antwoord op een oefening in
export async function submitAnswer(sessionId: string, answer: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  
  // Soms geeft de backend een 400 als het antwoord leeg is, dat vangen we af
  if (!res.ok) {
     const err = await res.json().catch(() => ({}));
     throw new Error(err.detail || "Kon antwoord niet versturen.");
  }
  return res.json();
}
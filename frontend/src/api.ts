const API_URL = "http://localhost:8000";

export interface SessionConfig {
  topic: string;
  difficulty: string;
  skill: string;
  tutor_id: "jan" | "sara";
}

export interface Exercise {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export async function createSession(config: SessionConfig) {
  const response = await fetch(`${API_URL}/start_session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error("Start session failed");
  return response.json();
}

export async function sendMessage(sessionId: string, text: string) {
  const response = await fetch(`${API_URL}/chat/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Send message failed");
  return response.json();
}

// NIEUW: Functie om thema te updaten
export async function setTheme(sessionId: string, theme: string) {
  const response = await fetch(`${API_URL}/set_theme/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
  if (!response.ok) throw new Error("Set theme failed");
  return response.json();
}
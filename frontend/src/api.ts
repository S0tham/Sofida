// src/api.ts

const API_BASE = "http://localhost:8000/api";

export async function createSession(tutor: string = "jan", config: any = null) {
  const res = await fetch(`${API_BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tutor, config }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function getSessionState(sessionId: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session state");
  return res.json();
}

export async function sendChat(sessionId: string, message: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to send chat message");
  return res.json();
}

export async function createExercise(sessionId: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/exercise`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to create exercise");
  return res.json();
}

export async function submitAnswer(sessionId: string, answer: string) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to submit answer");
  }
  return res.json();
}

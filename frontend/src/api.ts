const API_URL = "http://localhost:8000";

export interface SessionConfig {
  topic: string; difficulty: string; skill: string; tutor_id: "jan" | "sara";
}
export interface Exercise {
  question: string; options: string[]; correct_answer: string; explanation: string;
}

export async function createSession(config: SessionConfig) {
  const response = await fetch(`${API_URL}/start_session`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error("Start session failed");
  return response.json();
}

export async function sendMessage(sessionId: string, text: string) {
  const response = await fetch(`${API_URL}/chat/${sessionId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Send message failed");
  return response.json();
}

export async function setTheme(sessionId: string, theme: string) {
  const response = await fetch(`${API_URL}/set_theme/${sessionId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }),
  });
  return response.json();
}

export async function generateExercise(sessionId: string, theme: string): Promise<Exercise> {
  const response = await fetch(`${API_URL}/generate_exercise/${sessionId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }),
  });
  if (!response.ok) throw new Error("Kon geen oefening genereren");
  return response.json();
}

export async function speakText(text: string, tutorId: string) {
  const response = await fetch(`${API_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, tutor_id: tutorId }),
  });
  if (!response.ok) throw new Error("Spraak generatie mislukt");
  return response.blob();
}

// NIEUW: We gebruiken nu Scribe via de backend
export async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.mp3"); // Scribe accepteert mp3/wav/etc

  const response = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    body: formData, 
  });

  if (!response.ok) throw new Error("Transcriptie met Scribe mislukt");
  return response.json(); 
}
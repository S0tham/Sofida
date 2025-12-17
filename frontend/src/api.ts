const API_URL = "http://localhost:8000";

export interface SessionConfig {
  topic: string;
  difficulty: string;
  skill: string;
  tutor_id: "jan" | "sara"; // De keuze zit nu in de config
}

export interface Exercise {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

// FIX: We sturen nu 1 object 'config' mee, en de URL is kaal.
export async function createSession(config: SessionConfig) {
  // Let op: GEEN /${tutorId} meer achter de URL!
  const response = await fetch(`${API_URL}/start_session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error bij createSession:", errorText);
    throw new Error("Kan geen sessie starten met de backend.");
  }

  return response.json();
}

export async function sendMessage(sessionId: string, text: string) {
  const response = await fetch(`${API_URL}/chat/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    console.error("API Error bij sendMessage");
    throw new Error("Kan bericht niet versturen.");
  }

  return response.json();
}

export async function generateExercise(sessionId: string, theme: string): Promise<Exercise> {
  const response = await fetch(`${API_URL}/generate_exercise/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ theme }),
  });

  if (!response.ok) {
    throw new Error("Kon geen oefening genereren");
  }
  
  return response.json();
}
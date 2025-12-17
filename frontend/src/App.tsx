// src/App.tsx

import React, { useEffect, useState } from "react";
import {
  createSession,
  sendChat,
  createExercise,
  submitAnswer,
} from "./api";

interface TutorState {
  name: string;
}

interface WordLimit {
  min: number;
  max: number;
}

interface ExerciseContent {
  question?: string;
  options?: string[];
  sentence?: string;
  passage?: string;
  prompt?: string;
  rubric?: Record<string, string>;
  word_limit?: WordLimit;
  wordLimit?: WordLimit; // fallback
}

interface Exercise {
  exercise_id: string;
  type: string;
  topic: string;
  difficulty: string;
  instructions: string;
  content: ExerciseContent;
}

interface Feedback {
  tutor_name: string;
  feedback_text: string;
}

interface ChatTurn {
  role: "user" | "tutor";
  text: string;
}

interface SessionState {
  tutor: TutorState;
  config: any;
  chat_history: ChatTurn[];
  current_exercise: Exercise | null;
  current_exercise_id: string | null;
  current_feedback: Feedback | null;
}

const App: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(false);

  const [tutorChoice, setTutorChoice] = useState<"jan" | "sara">("jan");
  const [topic, setTopic] = useState("Present Perfect");
  const [theme, setTheme] = useState("school");
  const [skill, setSkill] = useState("grammar");
  const [difficulty, setDifficulty] = useState("medium");

  const [chatInput, setChatInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");

  const bootSession = async () => {
    try {
      setLoading(true);
      const config = { topic, theme, skill, difficulty };
      const data = await createSession(tutorChoice, config);
      setSessionId(data.session_id);
      setState(data.state as SessionState);
      setAnswerInput("");
      setChatInput("");
    } catch (err) {
      console.error(err);
      alert("Kon geen sessie aanmaken. Check of backend draait.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // init
    void bootSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetSession = async () => {
    await bootSession();
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    try {
      setLoading(true);
      const res = await sendChat(sessionId, chatInput.trim());
      setState(res.state as SessionState);
      setChatInput("");
    } catch (err) {
      console.error(err);
      alert("Fout bij verzenden chatbericht.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewExercise = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await createExercise(sessionId);
      setState(res.state as SessionState);
      setAnswerInput("");
    } catch (err) {
      console.error(err);
      alert("Fout bij genereren oefening.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !answerInput.trim()) return;
    try {
      setLoading(true);
      const res = await submitAnswer(sessionId, answerInput.trim());
      setState(res.state as SessionState);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Fout bij nakijken van antwoord.");
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = state?.current_exercise ?? null;
  const currentFeedback = state?.current_feedback ?? null;
  const chatHistory = state?.chat_history ?? [];
  const tutorName = state?.tutor?.name ?? "Tutor";

  // fallback voor word_limit naming
  const wl =
    currentExercise?.content.word_limit || currentExercise?.content.wordLimit;

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>AI Tutor (HAVO 5 Engels)</h1>
        <button
          onClick={handleResetSession}
          disabled={loading}
          style={styles.smallButton}
        >
          Nieuwe sessie
        </button>
      </header>

      <section style={styles.configBar}>
        <div>
          <label style={styles.label}>Tutor:</label>
          <select
            value={tutorChoice}
            onChange={(e) =>
              setTutorChoice(e.target.value === "sara" ? "sara" : "jan")
            }
            style={styles.select}
          >
            <option value="jan">Meester Jan</option>
            <option value="sara">Coach Sara</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Topic:</label>
          <input
            style={styles.input}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div>
          <label style={styles.label}>Thema:</label>
          <input
            style={styles.input}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
        </div>
        <div>
          <label style={styles.label}>Skill:</label>
          <select
            style={styles.select}
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          >
            <option value="grammar">Grammar</option>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Difficulty:</label>
          <select
            style={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button
          onClick={bootSession}
          disabled={loading}
          style={styles.button}
          title="Nieuwe sessie met deze instellingen"
        >
          Start met deze instellingen
        </button>
      </section>

      <main style={styles.main}>
        {/* Chat */}
        <div style={styles.chatPanel}>
          <h2>Chat met {tutorName}</h2>
          <div style={styles.chatBox}>
            {chatHistory.map((turn, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.chatBubble,
                  alignSelf: turn.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    turn.role === "user" ? "#e0f7fa" : "#f1f8e9",
                }}
              >
                <strong>{turn.role === "user" ? "Jij" : tutorName}:</strong>{" "}
                <span>{turn.text}</span>
              </div>
            ))}
            {chatHistory.length === 0 && (
              <div style={{ color: "#888", fontSize: 14 }}>
                Nog geen berichten. Stel een vraag aan de tutor!
              </div>
            )}
          </div>
          <div style={styles.chatInputRow}>
            <input
              style={styles.chatInput}
              placeholder="Typ je bericht aan de tutor..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            />
            <button
              onClick={handleSendChat}
              disabled={loading || !chatInput.trim()}
              style={styles.button}
            >
              Verstuur
            </button>
          </div>
        </div>

        {/* Oefenpaneel */}
        <div style={styles.exercisePanel}>
          <div style={styles.exerciseHeader}>
            <h2>Oefenpaneel</h2>
            <button
              onClick={handleNewExercise}
              disabled={loading}
              style={styles.button}
            >
              Nieuwe oefening
            </button>
          </div>

          <div style={styles.exerciseBox}>
            {!currentExercise && (
              <div style={{ color: "#888", fontSize: 14 }}>
                Nog geen oefening. Klik op <b>Nieuwe oefening</b> om te
                beginnen.
              </div>
            )}

            {currentExercise && (
              <>
                <p>
                  <strong>Exercise ID:</strong> {currentExercise.exercise_id}
                </p>
                <p>
                  <strong>Type:</strong> {currentExercise.type}{" "}
                  <strong>Topic:</strong> {currentExercise.topic}{" "}
                  <strong>Difficulty:</strong> {currentExercise.difficulty}
                </p>
                <p>
                  <strong>Instructie:</strong> {currentExercise.instructions}
                </p>

                {currentExercise.type === "mcq" && (
                  <>
                    <p>
                      <strong>Vraag:</strong>{" "}
                      {currentExercise.content.question}
                    </p>
                    <ul>
                      {(currentExercise.content.options || []).map(
                        (opt, i) => (
                          <li key={i}>
                            ({i}) {opt}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

                {currentExercise.type === "gapfill" && (
                  <p>
                    <strong>Zin:</strong> {currentExercise.content.sentence}
                  </p>
                )}

                {currentExercise.type === "reading" && (
                  <>
                    <p>
                      <strong>Tekst:</strong>{" "}
                      {currentExercise.content.passage &&
                      currentExercise.content.passage.length > 400
                        ? currentExercise.content.passage.slice(0, 400) + "..."
                        : currentExercise.content.passage}
                    </p>
                    <p>
                      <strong>Vraag:</strong>{" "}
                      {currentExercise.content.question}
                    </p>
                    <ul>
                      {(currentExercise.content.options || []).map(
                        (opt, i) => (
                          <li key={i}>
                            ({i}) {opt}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}

                {currentExercise.type === "writing" && (
                  <>
                    <p>
                      <strong>Schrijfopdracht:</strong>{" "}
                      {currentExercise.content.prompt}
                    </p>
                    {wl && (
                      <p>
                        <strong>Woordenlimiet:</strong> {wl.min} – {wl.max}{" "}
                        woorden
                      </p>
                    )}
                    <p>
                      <strong>Rubric:</strong>
                    </p>
                    <ul>
                      {currentExercise.content.rubric &&
                        Object.entries(currentExercise.content.rubric).map(
                          ([k, v]) => (
                            <li key={k}>
                              <strong>{k}:</strong> {v}
                            </li>
                          )
                        )}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>

          <div style={styles.answerBox}>
            <h3>Jouw antwoord</h3>
            {currentExercise && currentExercise.type === "writing" ? (
              <textarea
                style={styles.textarea}
                rows={5}
                placeholder="Typ hier je tekst..."
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
              />
            ) : (
              <input
                style={styles.inputFull}
                placeholder="Typ je antwoord (nummer, woord of korte zin)..."
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
              />
            )}
            <button
              onClick={handleSubmitAnswer}
              disabled={loading || !currentExercise || !answerInput.trim()}
              style={styles.button}
            >
              Nakijken
            </button>
          </div>

          <div style={styles.feedbackBox}>
            <h3>Feedback</h3>
            {!currentFeedback && (
              <div style={{ color: "#888", fontSize: 14 }}>
                Nog geen feedback. Maak eerst een oefening en lever een antwoord
                in.
              </div>
            )}
            {currentFeedback && (
              <p>
                <strong>{currentFeedback.tutor_name}:</strong>{" "}
                {currentFeedback.feedback_text}
              </p>
            )}
          </div>
        </div>
      </main>

      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingBox}>Bezig met model / server...</div>
        </div>
      )}
    </div>
  );
};

// dezelfde styles als eerder
const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "system-ui, sans-serif",
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "10px 20px",
    background: "#0d47a1",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  configBar: {
    padding: "10px 20px",
    background: "#e3f2fd",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  label: {
    marginRight: 4,
    fontSize: 12,
    textTransform: "uppercase",
  },
  select: {
    padding: "4px 6px",
    fontSize: 14,
  },
  input: {
    padding: "4px 6px",
    fontSize: 14,
    minWidth: 120,
  },
  button: {
    padding: "6px 10px",
    background: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 14,
  },
  smallButton: {
    padding: "4px 8px",
    background: "#1565c0",
    color: "white",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  main: {
    flex: 1,
    display: "flex",
    padding: "10px 20px 20px",
    gap: "10px",
  },
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "white",
    borderRadius: 8,
    padding: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    minWidth: 0,
  },
  chatBox: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#fafafa",
  },
  chatBubble: {
    maxWidth: "85%",
    padding: "6px 8px",
    borderRadius: 6,
    fontSize: 14,
  },
  chatInputRow: {
    display: "flex",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    padding: "6px 8px",
    fontSize: 14,
  },
  exercisePanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "white",
    borderRadius: 8,
    padding: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    minWidth: 0,
  },
  exerciseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  exerciseBox: {
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    background: "#fafafa",
    fontSize: 14,
    maxHeight: 260,
    overflowY: "auto",
  },
  answerBox: {
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    background: "#fff",
  },
  feedbackBox: {
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: 8,
    background: "#f9fbe7",
    minHeight: 80,
  },
  inputFull: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 14,
    marginBottom: 6,
  },
  textarea: {
    width: "100%",
    padding: "6px 8px",
    fontSize: 14,
    marginBottom: 6,
  },
  loadingOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    background: "white",
    padding: "10px 16px",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    fontSize: 14,
  },
};

export default App;

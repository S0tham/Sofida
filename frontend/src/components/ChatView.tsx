import { useEffect, useState, useRef } from "react";
import { MoreVertical, Send, Dumbbell, X, Check, Edit2, Mic, StopCircle, Volume2, ChevronDown } from "lucide-react";
import type { Vak } from "./types";
import { TutorSettings } from "./TutorSettings";
import * as api from "../api"; 

type Props = { vak: Vak; };

interface UIMessage {
  id: number;
  type: "tutor" | "user" | "exercise"; 
  text?: string;
  exercise?: api.Exercise;
}

export function ChatView({ vak }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTutorId, setActiveTutorId] = useState<"jan" | "sara">("jan");
  
  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // UI Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Exercise Menu State
  const [showExerciseMenu, setShowExerciseMenu] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("grammar");
  const [selectedTopic, setSelectedTopic] = useState("Present Simple");

  // Thema (Global)
  const [activeTheme, setActiveTheme] = useState("Algemeen");

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  const playTutorAudio = async (text: string) => {
      try {
          const audioBlob = await api.speakText(text, activeTutorId);
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audio.play();
      } catch (e) { console.error(e); }
  };

  const startSession = async (tutorId: "jan" | "sara") => {
    try {
      setIsLoading(true);
      setMessages([]);
      const data = await api.createSession({ 
          topic: vak.naam, difficulty: "medium", skill: "general", tutor_id: tutorId
      });
      setSessionId(data.session_id);
      setActiveTutorId(tutorId);
      setActiveTheme(data.state.theme || "Algemeen");
      const welcomeText = `Hoi! Ik ben ${data.state.tutor.name}. We gaan aan de slag met ${vak.naam}.`;
      setMessages([{ id: Date.now(), type: "tutor", text: welcomeText }]);
      playTutorAudio(welcomeText);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => { startSession(vak.id === 'engels' ? 'sara' : 'jan'); }, [vak.id]);

  // --- AUDIO LOGICA ---
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () => {
            setIsLoading(true); 
            setMessages(prev => [...prev, { id: Date.now(), type: "user", text: "🎤 (Luisteren...)" }]);
            try {
                const data = await api.transcribeAudio(new Blob(chunks, { type: 'audio/webm' }));
                setMessages(prev => prev.filter(m => m.text !== "🎤 (Luisteren...)"));
                if (data.text) handleSend(data.text);
            } catch (err) { alert("Kon audio niet verstaan."); } finally { setIsLoading(false); }
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
    } catch (err) { alert("Kan microfoon niet starten."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    }
  };

  const handleSend = async (textToSend: string = message) => {
    if (!textToSend.trim() || !sessionId) return;
    
    setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].text === textToSend && prev[prev.length - 1].type === "user") return prev;
        return [...prev, { id: Date.now(), type: "user", text: textToSend }];
    });
    setMessage("");
    setIsLoading(true);

    try {
      const data = await api.sendMessage(sessionId, textToSend);
      if (data && data.state && data.state.chat_history) {
          const lastMsg = data.state.chat_history[data.state.chat_history.length - 1];
          const newMessages: UIMessage[] = data.state.chat_history.map((msg: any, idx: number) => {
            if (msg.role === 'exercise' || msg.exercise) return { id: Date.now() + idx, type: 'exercise', exercise: msg.exercise };
            return { id: Date.now() + idx, type: msg.role === 'user' ? 'user' : 'tutor', text: msg.text || "..." };
          });
          setMessages(newMessages);
          if (lastMsg && lastMsg.role !== 'user' && lastMsg.role !== 'exercise') playTutorAudio(lastMsg.text);
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  // --- OEFENING MENU LOGICA ---
  const handleGenerateSpecificExercise = async () => {
      if(!sessionId) return;
      setShowExerciseMenu(false); // Menu sluiten
      setIsLoading(true);
      
      // Feedback in chat dat we bezig zijn
      setMessages(prev => [...prev, {id: Date.now(), type: "tutor", text: `Ik maak even een ${selectedSkill} oefening over ${selectedTopic}...`}]);

      try {
          // Specifieke request naar backend
          const exercise = await api.generateExercise(sessionId, selectedSkill, selectedTopic);
          setMessages(prev => [...prev, { id: Date.now(), type: "exercise", exercise: exercise }]);
          
          // Als het een schrijfopdracht is, laten we de tutor het even inleiden
          if(exercise.type === 'writing') {
             const intro = "Hier is je schrijfopdracht. Typ je antwoord gewoon in de chat, dan kijk ik het na!";
             playTutorAudio(intro);
          }

      } catch (e) {
          console.error(e);
          setMessages(prev => [...prev, {id: Date.now(), type: "tutor", text: "Oeps, er ging iets mis bij het maken van de oefening."}]);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white relative">
        {/* Tutor balk */}
        <div className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${vak.gradient} flex items-center justify-center`}>
                <span className="text-xl">{activeTutorId === 'jan' ? '👨‍🏫' : '👩‍🏫'}</span>
             </div>
             <div>
                <div className="text-gray-900 font-medium">{activeTutorId === 'jan' ? 'Meester Jan' : 'Coach Sara'}</div>
                <div className="text-xs text-gray-500">Thema: {activeTheme}</div>
             </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-50 rounded-lg"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg, index) => {
            if (msg.type === "exercise" && msg.exercise) {
               return <div key={msg.id || index} className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2">
                  <ExerciseCard exercise={msg.exercise} tutorId={activeTutorId} />
               </div>;
            }
            return (
              <div key={msg.id || index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} w-full`}>
                <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${msg.type === "user" ? "bg-[#5D64BE] text-white rounded-br-sm" : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isLoading && <div className="text-center text-sm text-gray-400 italic">...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Oefening Menu Popover (Verschijnt boven input) */}
        {showExerciseMenu && (
            <div className="absolute bottom-24 left-6 bg-white border border-indigo-100 rounded-xl shadow-xl p-4 w-72 animate-in slide-in-from-bottom-5 z-10">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-700">Oefening Maken</h3>
                    <button onClick={() => setShowExerciseMenu(false)}><X className="w-4 h-4 text-gray-400"/></button>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Soort Opdracht</label>
                        <select 
                            className="w-full mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#5D64BE]"
                            value={selectedSkill}
                            onChange={(e) => setSelectedSkill(e.target.value)}
                        >
                            <option value="grammar">Grammatica (Gap Fill)</option>
                            <option value="reading">Begrijpend Lezen</option>
                            <option value="writing">Schrijven (Open vraag)</option>
                            <option value="vocabulary">Woordenschat</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Onderwerp</label>
                        <select 
                            className="w-full mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#5D64BE]"
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                        >
                            <option value={activeTheme}>Huidig Thema ({activeTheme})</option>
                            <option value="Present Simple">Present Simple</option>
                            <option value="Present Continuous">Present Continuous</option>
                            <option value="Past Simple">Past Simple</option>
                            <option value="Present Perfect">Present Perfect</option>
                            <option value="Future Tense">Future Tense</option>
                            <option value="Irregular Verbs">Irregular Verbs</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleGenerateSpecificExercise}
                        className="w-full py-2 bg-[#5D64BE] text-white rounded-lg font-medium hover:bg-[#4A519E] transition-colors flex items-center justify-center gap-2"
                    >
                        <Dumbbell className="w-4 h-4" /> Start Oefening
                    </button>
                </div>
            </div>
        )}

        {/* Input balk */}
        <div className="border-t border-gray-100 p-6 bg-white">
          <div className="w-full flex gap-3 items-center">
            {/* Oefening knop (Opent nu het menu) */}
            <button 
                onClick={() => setShowExerciseMenu(!showExerciseMenu)} 
                className={`p-3 rounded-lg transition-colors ${showExerciseMenu ? "bg-[#5D64BE] text-white" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                title="Oefening Menu"
            >
              <Dumbbell className="w-5 h-5" />
            </button>

            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Typ of spreek..." className="flex-1 px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20" />
            
            <button onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-lg transition-colors ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{isRecording ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5" />}</button>
            <button onClick={() => handleSend()} disabled={!message.trim()} className="px-5 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      {showSettings && <TutorSettings vak={vak} onClose={() => setShowSettings(false)} />}
    </>
  );
}

// Oefening Kaart Component
function ExerciseCard({ exercise, tutorId }: { exercise: api.Exercise, tutorId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const readQuestion = async () => {
      try {
          const textToRead = `${exercise.question}. ${exercise.options ? exercise.options.join(". ") : ""}`;
          const audioBlob = await api.speakText(textToRead, tutorId);
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audio.play();
      } catch(e) { console.error(e); }
  };

  if (!exercise || !exercise.question) return <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs">Error: {JSON.stringify(exercise)}</div>;

  // Render logica voor Schrijfopdracht (heeft geen opties)
  if (exercise.type === 'writing') {
      return (
        <div className="w-full max-w-lg bg-white border border-orange-100 rounded-2xl p-5 shadow-md my-2">
            <div className="flex items-center justify-between mb-3 text-orange-600 font-medium text-sm">
                <span className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> Schrijfopdracht</span>
                <button onClick={readQuestion} className="p-1.5 hover:bg-orange-50 rounded-full"><Volume2 className="w-4 h-4"/></button>
            </div>
            <h3 className="text-gray-900 font-semibold mb-2 text-lg">{exercise.question}</h3>
            <p className="text-sm text-gray-500 italic mb-4">{exercise.explanation || "Typ je antwoord in de chat."}</p>
            <div className="text-xs bg-gray-50 p-2 rounded text-gray-400">
                (Typ je antwoord in de balk hieronder en verstuur het)
            </div>
        </div>
      );
  }

  // Render logica voor Multiple Choice / Gap Fill
  const checkAnswer = (option: string) => { setSelected(option); setShowResult(true); };

  return (
    <div className="w-full max-w-lg bg-white border border-indigo-100 rounded-2xl p-5 shadow-md my-2">
      <div className="flex items-center justify-between mb-3 text-indigo-600 font-medium text-sm">
        <span className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> 
            {exercise.type === 'gap_fill' ? "Vul in" : "Kies het juiste antwoord"}
        </span>
        <button onClick={readQuestion} className="p-1.5 hover:bg-indigo-50 rounded-full"><Volume2 className="w-4 h-4"/></button>
      </div>
      <h3 className="text-gray-900 font-semibold mb-4 text-lg">{exercise.question}</h3>
      <div className="space-y-2">
        {exercise.options.map((opt, i) => {
          let style = "border-gray-200 hover:bg-gray-50";
          if (showResult) {
             const isCorrect = opt.trim() === exercise.correct_answer.trim();
             if (isCorrect) style = "bg-green-50 border-green-200 text-green-800 font-medium";
             else if (opt === selected) style = "bg-red-50 border-red-200 text-red-800";
             else style = "opacity-50 border-gray-100";
          }
          return <button key={i} disabled={showResult} onClick={() => checkAnswer(opt)} className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${style}`}>{opt}{showResult && opt.trim() === exercise.correct_answer.trim() && <Check className="w-4 h-4 text-green-600"/>}</button>
        })}
      </div>
      {showResult && <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg animate-in fade-in"><strong>Uitleg:</strong> {exercise.explanation}</div>}
    </div>
  );
}
import { useEffect, useState } from "react";
import { MoreVertical, Send, Dumbbell, X, Check, RefreshCw } from "lucide-react";
import type { Vak } from "./types";
import { TutorSettings } from "./TutorSettings";
import * as api from "../api"; 

type Props = { vak: Vak; };

interface UIMessage {
  id: number;
  type: "tutor" | "user" | "exercise";
  text?: string;
  exercise?: api.Exercise; // Speciaal type voor oefeningen in de chat
}

export function ChatView({ vak }: Props) {
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Nieuwe state voor tutor keuze en oefeningen
  const [activeTutorId, setActiveTutorId] = useState<"jan" | "sara">("jan");
  const [showThemeInput, setShowThemeInput] = useState(false);
  const [exerciseTheme, setExerciseTheme] = useState("");
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);

  // Functie om sessie te starten (of herstarten bij tutor wissel)
  const startSession = async (tutorId: "jan" | "sara") => {
    try {
      setIsLoading(true);
      setMessages([]); // Geschiedenis wissen bij wissel
      
      const data = await api.createSession({ 
          topic: vak.naam,
          difficulty: "medium",
          skill: "general",
          tutor_id: tutorId
      });
      setSessionId(data.session_id);
      setActiveTutorId(tutorId);
      
      // Welkomstbericht
      setMessages([{
         id: Date.now(),
         type: "tutor",
         text: `Hoi! Ik ben ${data.state.tutor.name}. Ik ga je helpen met ${vak.naam}.`
      }]);

    } catch (error) {
      console.error(error);
      setMessages([{ id: 0, type: 'tutor', text: "Kan geen verbinding maken."}]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start bij het laden
  useEffect(() => {
    // Kies standaard Sara voor Engels, Jan voor de rest (als startpunt)
    const defaultTutor = vak.id === 'engels' ? 'sara' : 'jan';
    startSession(defaultTutor);
  }, [vak.id]);

  const handleSend = async () => {
    if (!message.trim() || !sessionId) return;
    const text = message.trim();
    
    setMessages((prev) => [...prev, { id: Date.now(), type: "user", text }]);
    setMessage("");
    setIsLoading(true);

    try {
      const data = await api.sendMessage(sessionId, text);
      const lastMsg = data.state.chat_history[data.state.chat_history.length - 1];
      if (lastMsg && lastMsg.role !== 'user') {
          setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'tutor', text: lastMsg.text }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now(), type: 'tutor', text: "Er ging iets mis."}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateExercise = async () => {
    if (!sessionId || !exerciseTheme) return;
    setShowThemeInput(false);
    setIsGeneratingExercise(true);

    // Plaats een placeholder bericht
    const loadingId = Date.now();
    setMessages(prev => [...prev, { id: loadingId, type: "tutor", text: `Even een oefening bedenken over "${exerciseTheme}"...` }]);

    try {
      const exercise = await api.generateExercise(sessionId, exerciseTheme);
      // Vervang placeholder door echte oefening
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingId),
        { id: Date.now(), type: "exercise", exercise: exercise }
      ]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), type: "tutor", text: "Kon geen oefening maken." }]);
    } finally {
      setIsGeneratingExercise(false);
      setExerciseTheme("");
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Tutor balk */}
        <div className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${vak.gradient} flex items-center justify-center`}>
                <span className="text-xl">{activeTutorId === 'jan' ? '👨‍🏫' : '👩‍🏫'}</span>
             </div>
             <div>
                <div className="text-gray-900 font-medium">{activeTutorId === 'jan' ? 'Meester Jan' : 'Coach Sara'}</div>
                <div className="text-xs text-gray-500 flex gap-2">
                   <button onClick={() => startSession('jan')} className={`hover:text-[#5D64BE] ${activeTutorId === 'jan' ? 'font-bold text-[#5D64BE]' : ''}`}>Meester Jan</button>
                   |
                   <button onClick={() => startSession('sara')} className={`hover:text-[#5D64BE] ${activeTutorId === 'sara' ? 'font-bold text-[#5D64BE]' : ''}`}>Coach Sara</button>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-50 rounded-lg"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg) => {
            if (msg.type === "exercise" && msg.exercise) {
               return <ExerciseCard key={msg.id} exercise={msg.exercise} />;
            }
            return (
              <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} w-full`}>
                <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                  msg.type === "user" ? "bg-[#5D64BE] text-white rounded-br-sm" : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {(isLoading || isGeneratingExercise) && <div className="text-center text-sm text-gray-400 italic">Aan het typen...</div>}
        </div>

        {/* Input balk */}
        <div className="border-t border-gray-100 p-6 bg-white relative">
          
          {/* Thema Popup */}
          {showThemeInput && (
            <div className="absolute bottom-24 left-6 right-6 bg-white shadow-xl border border-gray-100 p-4 rounded-xl z-10 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="font-semibold text-gray-800">Kies een thema</h3>
                 <button onClick={() => setShowThemeInput(false)}><X className="w-4 h-4 text-gray-400"/></button>
               </div>
               <div className="flex gap-2">
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Bijv: Voetbal, Minecraft, Dieren..." 
                   value={exerciseTheme}
                   onChange={(e) => setExerciseTheme(e.target.value)}
                   onKeyDown={(e) => e.key === "Enter" && handleGenerateExercise()}
                   className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#5D64BE] outline-none"
                 />
                 <button onClick={handleGenerateExercise} className="bg-[#5D64BE] text-white px-4 py-2 rounded-lg text-sm font-medium">Start</button>
               </div>
            </div>
          )}

          <div className="w-full flex gap-3 items-center">
            {/* Oefening knop */}
            <button 
              onClick={() => setShowThemeInput(!showThemeInput)}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              title="Oefening genereren"
            >
              <Dumbbell className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Typ je vraag..."
              className="flex-1 px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
            />
            <button onClick={handleSend} disabled={!message.trim()} className="px-5 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {showSettings && <TutorSettings vak={vak} onClose={() => setShowSettings(false)} />}
    </>
  );
}

// Klein componentje om de oefening netjes weer te geven
function ExerciseCard({ exercise }: { exercise: api.Exercise }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const checkAnswer = (option: string) => {
    setSelected(option);
    setShowResult(true);
  };

  return (
    <div className="w-full max-w-lg bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm my-4">
      <div className="flex items-center gap-2 mb-3 text-indigo-600 font-medium text-sm">
        <Dumbbell className="w-4 h-4" /> Oefening
      </div>
      <h3 className="text-gray-900 font-semibold mb-4 text-lg">{exercise.question}</h3>
      <div className="space-y-2">
        {exercise.options.map((opt) => {
          let style = "border-gray-200 hover:bg-gray-50";
          if (showResult) {
             if (opt === exercise.correct_answer) style = "bg-green-50 border-green-200 text-green-800";
             else if (opt === selected && opt !== exercise.correct_answer) style = "bg-red-50 border-red-200 text-red-800";
             else style = "opacity-50 border-gray-100";
          }
          return (
            <button
              key={opt}
              disabled={showResult}
              onClick={() => checkAnswer(opt)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${style}`}
            >
              {opt}
              {showResult && opt === exercise.correct_answer && <Check className="w-4 h-4 text-green-600"/>}
            </button>
          )
        })}
      </div>
      {showResult && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg">
          <strong>Uitleg:</strong> {exercise.explanation}
        </div>
      )}
    </div>
  );
}
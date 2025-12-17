import { useEffect, useState, useRef } from "react";
// DEZE REGEL HIERONDER LOSTE JE FOUTMELDING OP:
import { MoreVertical, Send, Dumbbell, X, Check, Edit2 } from "lucide-react";
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
  
  // Auto-scroll referentie
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Thema state
  const [activeTheme, setActiveTheme] = useState("Algemeen");
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [tempTheme, setTempTheme] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startSession = async (tutorId: "jan" | "sara") => {
    try {
      setIsLoading(true);
      setMessages([]);
      const data = await api.createSession({ 
          topic: vak.naam,
          difficulty: "medium",
          skill: "general",
          tutor_id: tutorId
      });
      setSessionId(data.session_id);
      setActiveTutorId(tutorId);
      setActiveTheme(data.state.theme || "Algemeen");
      
      setMessages([{
         id: Date.now(),
         type: "tutor",
         text: `Hoi! Ik ben ${data.state.tutor.name}. We gaan aan de slag met ${vak.naam}.`
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const defaultTutor = vak.id === 'engels' ? 'sara' : 'jan';
    startSession(defaultTutor);
  }, [vak.id]);

  const handleSend = async (textToSend: string = message) => {
    if (!textToSend.trim() || !sessionId) return;
    
    // Voeg user bericht toe
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, type: "user", text: textToSend }]);
    setMessage("");
    setIsLoading(true);

    try {
      const data = await api.sendMessage(sessionId, textToSend);
      
      // Update geschiedenis vanuit backend
      if (data && data.state && data.state.chat_history) {
          const newMessages: UIMessage[] = data.state.chat_history.map((msg: any, idx: number) => {
            
            // 1. Check of het een oefening is
            if (msg.role === 'exercise' || msg.exercise) {
               return { 
                   id: Date.now() + idx, 
                   type: 'exercise', 
                   exercise: msg.exercise 
               };
            }
            
            // 2. Anders is het een tekst bericht
            return { 
               id: Date.now() + idx, 
               type: msg.role === 'user' ? 'user' : 'tutor', 
               text: msg.text || "..." 
            };
          });
          
          setMessages(newMessages);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeUpdate = async () => {
      if(!sessionId || !tempTheme.trim()) return;
      await api.setTheme(sessionId, tempTheme);
      setActiveTheme(tempTheme);
      setIsEditingTheme(false);
      handleSend(`Ik wil de opdrachten nu graag over het thema '${tempTheme}' hebben.`);
  };

  const requestExercise = () => {
      handleSend("Geef me een oefening over het huidige thema.");
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
                   <button onClick={() => startSession('jan')} className={`hover:text-[#5D64BE] ${activeTutorId === 'jan' ? 'font-bold text-[#5D64BE]' : ''}`}>Jan</button>|
                   <button onClick={() => startSession('sara')} className={`hover:text-[#5D64BE] ${activeTutorId === 'sara' ? 'font-bold text-[#5D64BE]' : ''}`}>Sara</button>
                </div>
             </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-50 rounded-lg"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
        </div>

        {/* Thema Balk */}
        <div className="bg-indigo-50/50 border-b border-indigo-100 px-6 py-2 flex items-center justify-between text-sm">
            {isEditingTheme ? (
                <div className="flex w-full gap-2">
                    <input 
                        className="flex-1 px-2 py-1 rounded border border-indigo-200 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5D64BE]"
                        placeholder="Nieuw thema..."
                        value={tempTheme}
                        onChange={(e) => setTempTheme(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleThemeUpdate()}
                    />
                    <button onClick={handleThemeUpdate} className="text-[#5D64BE] font-medium hover:underline">Opslaan</button>
                    <button onClick={() => setIsEditingTheme(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                </div>
            ) : (
                <div className="flex w-full justify-between items-center group">
                    <span className="text-gray-600">
                        Huidig thema: <span className="font-semibold text-[#5D64BE]">{activeTheme}</span>
                    </span>
                    <button 
                        onClick={() => { setTempTheme(activeTheme); setIsEditingTheme(true); }}
                        className="text-gray-400 hover:text-[#5D64BE] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit2 className="w-3 h-3" /> Wijzig
                    </button>
                </div>
            )}
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg, index) => {
            // RENDER OEFENING
            if (msg.type === "exercise" && msg.exercise) {
               return (
                   <div key={msg.id || index} className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2">
                       <ExerciseCard exercise={msg.exercise} />
                   </div>
               );
            }
            
            // RENDER TEKST
            return (
              <div key={msg.id || index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} w-full`}>
                <div className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                  msg.type === "user" ? "bg-[#5D64BE] text-white rounded-br-sm" : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isLoading && <div className="text-center text-sm text-gray-400 italic">De tutor denkt na...</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input balk */}
        <div className="border-t border-gray-100 p-6 bg-white">
          <div className="w-full flex gap-3 items-center">
            <button 
              onClick={requestExercise}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              title="Genereer direct een oefening"
            >
              <Dumbbell className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Typ je bericht..."
              className="flex-1 px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
            />
            <button onClick={() => handleSend()} disabled={!message.trim()} className="px-5 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {showSettings && <TutorSettings vak={vak} onClose={() => setShowSettings(false)} />}
    </>
  );
}

function ExerciseCard({ exercise }: { exercise: api.Exercise }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // DEBUG: Als er geen vraag is, laat dan zien wat we WEL hebben ontvangen
  if (!exercise || !exercise.question) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-mono w-full max-w-lg">
        <strong>Debug Info:</strong> Data incompleet of onjuiste sleutels.
        <pre className="mt-2 whitespace-pre-wrap">
          {JSON.stringify(exercise, null, 2)}
        </pre>
      </div>
    );
  }

  const checkAnswer = (option: string) => {
    setSelected(option);
    setShowResult(true);
  };

  return (
    <div className="w-full max-w-lg bg-white border border-indigo-100 rounded-2xl p-5 shadow-md my-2">
      <div className="flex items-center gap-2 mb-3 text-indigo-600 font-medium text-sm">
        <Dumbbell className="w-4 h-4" /> Oefening
      </div>
      <h3 className="text-gray-900 font-semibold mb-4 text-lg">{exercise.question}</h3>
      <div className="space-y-2">
        {exercise.options.map((opt, i) => {
          let style = "border-gray-200 hover:bg-gray-50";
          if (showResult) {
             const isCorrect = opt.trim() === exercise.correct_answer.trim();
             const isSelected = opt === selected;
             
             if (isCorrect) style = "bg-green-50 border-green-200 text-green-800 font-medium";
             else if (isSelected) style = "bg-red-50 border-red-200 text-red-800";
             else style = "opacity-50 border-gray-100";
          }
          return (
            <button
              key={i}
              disabled={showResult}
              onClick={() => checkAnswer(opt)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${style}`}
            >
              {opt}
              {showResult && opt.trim() === exercise.correct_answer.trim() && <Check className="w-4 h-4 text-green-600"/>}
            </button>
          )
        })}
      </div>
      {showResult && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg animate-in fade-in">
          <strong>Uitleg:</strong> {exercise.explanation}
        </div>
      )}
    </div>
  );
}
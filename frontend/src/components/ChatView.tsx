import { useEffect, useState, useRef } from "react";
// BELANGRIJK: Hier importeren we de iconen voor de microfoon en speaker
import { MoreVertical, Send, Dumbbell, X, Check, Edit2, Mic, StopCircle, Volume2 } from "lucide-react";
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
  
  // --- AUDIO STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTheme, setActiveTheme] = useState("Algemeen");
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [tempTheme, setTempTheme] = useState("");

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // Hulpfunctie: Laat de tutor praten (ElevenLabs via Backend)
  const playTutorAudio = async (text: string) => {
      try {
          console.log("🔊 Audio ophalen voor:", text.substring(0, 20) + "...");
          const audioBlob = await api.speakText(text, activeTutorId);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
      } catch (e) {
          console.error("Kon audio niet afspelen", e);
      }
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
      
      // Spreek welkomstbericht uit
      playTutorAudio(welcomeText);

    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const defaultTutor = vak.id === 'engels' ? 'sara' : 'jan';
    startSession(defaultTutor);
  }, [vak.id]);

  // --- OPNEMEN MET MICROFOON (Naar Scribe) ---
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        recorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' }); // Browsers nemen vaak op in webm
            setIsLoading(true); 
            
            // Zet een tijdelijk berichtje neer zodat je ziet dat hij bezig is
            setMessages(prev => [...prev, { id: Date.now(), type: "user", text: "🎤 (Aan het luisteren...)" }]);

            try {
                // Stuur audio naar backend -> ElevenLabs Scribe
                const data = await api.transcribeAudio(audioBlob);
                
                // Verwijder het "luisteren..." bericht
                setMessages(prev => prev.filter(m => m.text !== "🎤 (Aan het luisteren...)"));

                if (data.text) {
                    // Verstuur de tekst die Scribe heeft gevonden
                    handleSend(data.text);
                }
            } catch (err) {
                console.error("Scribe error:", err);
                setMessages(prev => prev.filter(m => m.text !== "🎤 (Aan het luisteren...)"));
                alert("Kon audio niet verstaan.");
            } finally {
                setIsLoading(false);
            }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic error", err);
        alert("Kan microfoon niet starten. Heb je toestemming gegeven?");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        // Stop ook de tracks om het rode bolletje in de tab te doven
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    }
  };

  const handleSend = async (textToSend: string = message) => {
    if (!textToSend.trim() || !sessionId) return;
    
    // Voeg user bericht toe (als het nog niet in de lijst staat via de microfoon logica)
    setMessages((prev) => {
        // Voorkom dubbele berichten als de functie snel achter elkaar wordt aangeroepen
        if (prev.length > 0 && prev[prev.length - 1].text === textToSend && prev[prev.length - 1].type === "user") {
            return prev;
        }
        return [...prev, { id: Date.now(), type: "user", text: textToSend }];
    });

    setMessage("");
    setIsLoading(true);

    try {
      const data = await api.sendMessage(sessionId, textToSend);
      
      if (data && data.state && data.state.chat_history) {
          const lastMsg = data.state.chat_history[data.state.chat_history.length - 1];
          
          const newMessages: UIMessage[] = data.state.chat_history.map((msg: any, idx: number) => {
            if (msg.role === 'exercise' || msg.exercise) {
               return { id: Date.now() + idx, type: 'exercise', exercise: msg.exercise };
            }
            return { id: Date.now() + idx, type: msg.role === 'user' ? 'user' : 'tutor', text: msg.text || "..." };
          });
          setMessages(newMessages);

          // Als het laatste bericht van de tutor is, spreek het uit
          if (lastMsg && lastMsg.role !== 'user' && lastMsg.role !== 'exercise') {
              playTutorAudio(lastMsg.text);
          }
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleThemeUpdate = async () => {
      if(!sessionId || !tempTheme.trim()) return;
      await api.setTheme(sessionId, tempTheme);
      setActiveTheme(tempTheme);
      setIsEditingTheme(false);
      handleSend(`Ik wil de opdrachten nu graag over het thema '${tempTheme}' hebben.`);
  };

  const requestExercise = () => handleSend("Geef me een oefening over het huidige thema.");

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
                    <input className="flex-1 px-2 py-1 rounded border border-indigo-200" value={tempTheme} onChange={(e) => setTempTheme(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleThemeUpdate()} placeholder="Thema..." />
                    <button onClick={handleThemeUpdate} className="text-[#5D64BE]">Opslaan</button>
                    <button onClick={() => setIsEditingTheme(false)} className="text-gray-400"><X className="w-4 h-4"/></button>
                </div>
            ) : (
                <div className="flex w-full justify-between items-center group">
                    <span className="text-gray-600">Thema: <span className="font-semibold text-[#5D64BE]">{activeTheme}</span></span>
                    <button onClick={() => { setTempTheme(activeTheme); setIsEditingTheme(true); }} className="text-gray-400 hover:text-[#5D64BE] flex items-center gap-1 opacity-0 group-hover:opacity-100"><Edit2 className="w-3 h-3" /> Wijzig</button>
                </div>
            )}
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

        {/* Input balk - HIER ZITEN DE KNOPPEN */}
        <div className="border-t border-gray-100 p-6 bg-white">
          <div className="w-full flex gap-3 items-center">
            {/* 1. Oefening knop (Dumbbell) */}
            <button onClick={requestExercise} className="p-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Genereer oefening">
              <Dumbbell className="w-5 h-5" />
            </button>

            {/* 2. Tekst invoer */}
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Typ of spreek..." className="flex-1 px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20" />
            
            {/* 3. MICROFOON KNOP (Hier miste je hem waarschijnlijk!) */}
            <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-lg transition-colors ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title="Houd ingedrukt of klik om op te nemen"
            >
                {isRecording ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5" />}
            </button>

            {/* 4. Verzend knop */}
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

// Oefening Kaart Component
function ExerciseCard({ exercise, tutorId }: { exercise: api.Exercise, tutorId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Functie om de vraag voor te lezen
  const readQuestion = async () => {
      try {
          const textToRead = `${exercise.question}. ${exercise.options.join(". ")}`;
          const audioBlob = await api.speakText(textToRead, tutorId);
          const audio = new Audio(URL.createObjectURL(audioBlob));
          audio.play();
      } catch(e) { console.error(e); }
  };

  if (!exercise || !exercise.question) return <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs">Error: {JSON.stringify(exercise)}</div>;

  const checkAnswer = (option: string) => { setSelected(option); setShowResult(true); };

  return (
    <div className="w-full max-w-lg bg-white border border-indigo-100 rounded-2xl p-5 shadow-md my-2">
      <div className="flex items-center justify-between mb-3 text-indigo-600 font-medium text-sm">
        <span className="flex items-center gap-2"><Dumbbell className="w-4 h-4" /> Oefening</span>
        {/* HIER ZIT HET SPEAKERTJE VOOR DE VRAAG */}
        <button onClick={readQuestion} className="p-1.5 hover:bg-indigo-50 rounded-full" title="Lees voor"><Volume2 className="w-4 h-4"/></button>
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
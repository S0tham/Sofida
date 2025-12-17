import { useState, useEffect, useRef } from 'react';
import * as api from './api';
import ExerciseRenderer from './components/ExerciseRenderer';

// Types voor de chatberichten
interface Message {
  role: string;
  text: string;
}

export default function App() {
  // --- STATE ---
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tutorName, setTutorName] = useState("AI Tutor");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-scroll referentie
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentExercise, loading]);


  // --- ACTIES ---

  const handleStartSession = async (tutor: string) => {
    try {
      setLoading(true);
      // Hier kun je later inputs voor maken als je wilt (bijv. difficulty slider)
      const config = { topic: "General", difficulty: "medium", skill: "grammar" };
      
      const data = await api.createSession(tutor, config);
      
      setSessionId(data.session_id);
      setTutorName(data.state.tutor.name);
      setMessages(data.state.chat_history || []);
      
      // Als er nog geen chatgeschiedenis is, stuur zelf een "Start" trigger
      if (!data.state.chat_history || data.state.chat_history.length === 0) {
        // We sturen een onzichtbaar bericht of triggeren een begroeting in de UI
        // Voor nu laten we de gebruiker het gesprek beginnen of wachten op de tutor
      }
    } catch (e) {
      console.error(e);
      alert("Kan geen verbinding maken met de backend. Draait 'main.py'?");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() || !sessionId) return;
    
    // Optimistic UI: toon bericht meteen
    const newMsg = { role: 'user', text };
    const prevMessages = [...messages];
    setMessages([...prevMessages, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.sendMessage(sessionId, text);
      setMessages(data.state.chat_history);
    } catch (e) {
      console.error(e);
      // Terugdraaien bij fout
      setMessages(prevMessages);
      alert("Er ging iets mis bij het versturen.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewExercise = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.requestExercise(sessionId);
      setMessages(data.state.chat_history);
      setCurrentExercise(data.exercise);
    } catch (e) {
      console.error(e);
      alert("Kon geen oefening laden.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.submitAnswer(sessionId, answer);
      setMessages(data.state.chat_history);
      setCurrentExercise(null); // Oefening is klaar
    } catch (e) {
      console.error(e);
      alert("Fout bij nakijken.");
    } finally {
      setLoading(false);
    }
  };


  // --- SCHERM 1: KEUZEMENU ---
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          <div className="p-8 md:w-1/2 flex flex-col justify-center border-r border-gray-100">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Engels Tutor</h1>
            <p className="text-gray-500 mb-8">Kies je persoonlijke coach om te beginnen met oefenen.</p>
            
            <button 
              onClick={() => handleStartSession("jan")}
              className="group relative w-full mb-4 p-4 rounded-xl border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">J</div>
                <div>
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-700">Meester Jan</h3>
                  <p className="text-xs text-gray-500">Geduldig & Bemoedigend</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => handleStartSession("sara")}
              className="group relative w-full p-4 rounded-xl border-2 border-purple-100 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">S</div>
                <div>
                  <h3 className="font-bold text-gray-800 group-hover:text-purple-700">Coach Sara</h3>
                  <p className="text-xs text-gray-500">Direct & Resultaatgericht</p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-blue-600 p-8 md:w-1/2 flex flex-col justify-center text-white">
            <h2 className="text-2xl font-bold mb-4">Klaar voor je examen?</h2>
            <ul className="space-y-3 text-blue-100 text-sm">
              <li className="flex gap-2">✓ Oefen grammatica (Present Perfect, Conditionals)</li>
              <li className="flex gap-2">✓ Train leesvaardigheid</li>
              <li className="flex gap-2">✓ Krijg feedback op je schrijfopdrachten</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // --- SCHERM 2: DE CHAT ---
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${tutorName.includes("Jan") ? "bg-blue-500" : "bg-purple-600"}`}>
             {tutorName[0]}
           </div>
           <div>
             <h1 className="font-bold text-gray-800">{tutorName}</h1>
             <p className="text-xs text-green-600 flex items-center gap-1">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
             </p>
           </div>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={handleNewExercise}
              disabled={loading || currentExercise !== null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              + Nieuwe Oefening
            </button>
            <button 
              onClick={() => setSessionId(null)}
              className="text-gray-400 hover:text-red-500 p-2"
              title="Afsluiten"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
        </div>
      </header>

      {/* CHAT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                
                {/* Avatar naast bericht */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isUser ? 'bg-gray-200 text-gray-600' : (tutorName.includes("Jan") ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}`}>
                   {isUser ? 'Jij' : tutorName[0]}
                </div>

                <div 
                  className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* ACTIEVE OEFENING COMPONENT */}
        {currentExercise && (
           <div className="max-w-3xl mx-auto animate-fade-in-up">
              <ExerciseRenderer 
                exercise={currentExercise} 
                onSubmit={handleSubmitAnswer} 
                isLoading={loading}
              />
           </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex justify-start pl-12">
            <div className="bg-gray-100 px-4 py-2 rounded-full text-xs text-gray-500 animate-pulse flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* INPUT AREA */}
      <footer className="bg-white p-4 border-t border-gray-200">
        <div className="max-w-4xl mx-auto relative flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={currentExercise ? "Maak de oefening hierboven..." : "Typ een bericht..."}
              disabled={loading || currentExercise !== null} 
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block w-full p-4 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim() || currentExercise !== null}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3.5 shadow-md disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          {currentExercise ? "Tip: Gebruik de knoppen in de oefening hierboven." : "AI kan fouten maken."}
        </p>
      </footer>

    </div>
  );
}
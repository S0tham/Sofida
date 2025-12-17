import { useEffect, useState } from "react";
import { MoreVertical, Send } from "lucide-react";
import type { Vak } from "./types";
import { TutorSettings } from "./TutorSettings";
import * as api from "../api"; 

type Props = {
  vak: Vak;
};

// Type voor berichten in de UI
interface UIMessage {
  id: number;
  type: "tutor" | "user" | "bot"; 
  text: string;
}

export function ChatView({ vak }: Props) {
  const [activeTab, setActiveTab] = useState<"chat" | "geschiedenis">("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // We mappen de vakken van de frontend naar jouw Python karakters
  const getTutorId = (vakId: string) => {
    if (vakId === 'engels') return 'sara'; // Engels -> Sara
    return 'jan'; // Alle andere vakken -> Jan
  };

  // Start sessie zodra het vak opent
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        const tutorId = getTutorId(vak.id);
        
        // --- HIER ZAT DE FOUT ---
        // We voegen nu difficulty en skill toe om TypeScript blij te maken
        const data = await api.createSession(tutorId, { 
            topic: vak.naam,
            difficulty: "medium", // Standaard waarde
            skill: "general"      // Standaard waarde
        });
        // ------------------------

        setSessionId(data.session_id);
        
        // Converteer geschiedenis naar UI formaat
        const history: UIMessage[] = data.state.chat_history.map((msg: any, index: number) => ({
          id: index,
          type: msg.role === 'user' ? 'user' : 'tutor',
          text: msg.text
        }));
        
        if (history.length === 0) {
           // Welkomstbericht als er nog niks is
           setMessages([{
             id: Date.now(),
             type: "tutor",
             text: `Hoi! Ik ben ${data.state.tutor.name}. Ik ga je helpen met ${vak.naam}. Waar zullen we mee beginnen?`
           }]);
        } else {
           setMessages(history);
        }

      } catch (error) {
        console.error("Fout bij starten sessie:", error);
        setMessages([{ id: 0, type: 'bot', text: "Kan geen verbinding maken met de AI backend. Zorg dat main.py draait."}]);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [vak.id]); // <--- Deze dependency zorgt dat hij herlaadt als je van vak wisselt

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !sessionId) return;

    // 1. Zet bericht direct in beeld
    const userMsg: UIMessage = { id: Date.now(), type: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsLoading(true);

    try {
      // 2. Stuur naar backend
      const data = await api.sendMessage(sessionId, text);
      
      // 3. Update met antwoord van AI
      const lastMsg = data.state.chat_history[data.state.chat_history.length - 1];
      if (lastMsg && lastMsg.role !== 'user') {
          setMessages((prev) => [...prev, {
              id: Date.now() + 1,
              type: 'tutor',
              text: lastMsg.text
          }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now(), type: 'bot', text: "Er ging iets mis met het versturen."}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Tutor balk */}
        <div className="border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setShowSettings(true)} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${vak.gradient} flex items-center justify-center`}>
                <span className="text-xl">{vak.tutor.avatar}</span>
              </div>
              <div className="text-left">
                <div className="text-gray-900">{vak.tutor.naam}</div>
                <div className="text-gray-500">{vak.naam} tutor</div>
              </div>
            </button>

            <div className="flex items-center gap-2">
               {/* Indicator dat AI denkt */}
               {isLoading && <span className="text-sm text-gray-400 italic">Typen...</span>}
              <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-gray-50/30">
          {activeTab === "chat" ? (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} w-full`}>
                {msg.type === "user" ? (
                  <div className="inline-block max-w-[70%] px-5 py-3 rounded-2xl bg-[#5D64BE] text-white rounded-br-sm shadow-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="inline-block max-w-[70%] px-5 py-3 rounded-2xl bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm">
                    {msg.text}
                  </div>
                )}
              </div>
            ))
          ) : (
             <div className="text-center py-12 text-gray-500">Geschiedenis laden...</div>
          )}
        </div>

        {/* Input balk */}
        <div className="border-t border-gray-100 p-6 bg-white">
          <div className="w-full flex gap-3 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isLoading ? "Even wachten op antwoord..." : "Typ je vraag..."}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className={`px-5 py-3 rounded-lg transition-colors ${
                message.trim() && !isLoading
                  ? "bg-[#5D64BE] text-white hover:bg-[#5D64BE]/90"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <TutorSettings vak={vak} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
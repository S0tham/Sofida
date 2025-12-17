import { useState } from "react";
import { VakkenToevoegen } from "./VakkenToevoegen";
import { ChatList } from "./ChatList";
import { ChatView } from "./ChatView";
import type { Vak } from "./types";

export function VakkenFlow() {
  const defaultVakken: Vak[] = [
    {
      id: "engels",
      naam: "Engels",
      categorie: "Taal",
      gradient: "from-[#90D5FE] to-[#6BB6E8]",
      tutor: {
        naam: "James",
        avatar: "👨‍🏫",
        instructies: "Help students with English language learning",
        boek: "English Tutor Guide",
      },
    },
    {
      id: "wiskunde",
      naam: "Wiskunde",
      categorie: "STEM",
      gradient: "from-[#FCA5A5] to-[#F87171]",
      tutor: {
        naam: "Dr. Math",
        avatar: "🧮",
        instructies: "Mathematics tutor",
        boek: "Math Guide",
      },
    },
    {
      id: "nederlands",
      naam: "Nederlands",
      categorie: "Taal",
      gradient: "from-[#FBBF24] to-[#F59E0B]",
      tutor: {
        naam: "Meester Jan",
        avatar: "📚",
        instructies: "Dutch language tutor",
        boek: "Nederlands Guide",
      },
    },
    {
      id: "natuurkunde",
      naam: "Natuurkunde",
      categorie: "STEM",
      gradient: "from-[#34D399] to-[#10B981]",
      tutor: {
        naam: "Prof. Science",
        avatar: "🔬",
        instructies: "Physics tutor",
        boek: "Physics Guide",
      },
    },
    {
      id: "scheikunde",
      naam: "Scheikunde",
      categorie: "STEM",
      gradient: "from-[#818CF8] to-[#6366F1]",
      tutor: {
        naam: "Dr. Chemistry",
        avatar: "⚗️",
        instructies: "Chemistry tutor",
        boek: "Chemistry Guide",
      },
    },
    {
      id: "biologie",
      naam: "Biologie",
      categorie: "STEM",
      gradient: "from-[#C084FC] to-[#A855F7]",
      tutor: {
        naam: "Dr. Bio",
        avatar: "🧬",
        instructies: "Biology tutor",
        boek: "Biology Guide",
      },
    },
  ];

  const [view, setView] = useState<"toevoegen" | "chatlist" | "chat">(
    "chatlist"
  );
  const [geselecteerdeVakken, setGeselecteerdeVakken] =
    useState<Vak[]>(defaultVakken);
  const [huidigVak, setHuidigVak] = useState<Vak | null>(null);

  const handleVakkenToevoegen = (vakken: Vak[]) => {
    setGeselecteerdeVakken(vakken);
    setView("chatlist");
  };

  const handleChatOpenen = (vak: Vak) => {
    // Only allow Engels to be opened
    if (vak.id === "engels") {
      setHuidigVak(vak);
      setView("chat");
    }
  };

  const handleNieuwVakToevoegen = () => {
    setView("toevoegen");
  };

  return (
    <div className="flex h-full">
      {/* Chatlijst - altijd zichtbaar */}
      <div className="w-80 border-r border-gray-100">
        <ChatList
          vakken={geselecteerdeVakken}
          onChatOpenen={handleChatOpenen}
          onNieuwVak={handleNieuwVakToevoegen}
          activeVakId={huidigVak?.id}
        />
      </div>

      {/* Rechter paneel - vakken toevoegen of chat */}
      <div className="flex-1 min-w-0">
        {view === "toevoegen" ? (
          <VakkenToevoegen
            bestaandeVakken={geselecteerdeVakken}
            onToevoegen={handleVakkenToevoegen}
          />
        ) : view === "chat" && huidigVak ? (
          <ChatView vak={huidigVak} />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-12">
            <div>
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-gray-900 mb-2">Selecteer een chat</h3>
              <p className="text-gray-500">
                Kies een vak om te beginnen met chatten
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

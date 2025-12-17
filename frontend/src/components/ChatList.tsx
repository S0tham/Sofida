import { Plus, MessageSquare } from "lucide-react";
import type { Vak } from "./types"; // <--- AANGEPAST: Komt nu uit types.ts

type Props = {
  vakken: Vak[];
  onChatOpenen: (vak: Vak) => void;
  onNieuwVak: () => void;
  activeVakId?: string;
};

export function ChatList({
  vakken,
  onChatOpenen,
  onNieuwVak,
  activeVakId,
}: Props) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-gray-900 mb-1">Chats</h2>
        <p className="text-gray-500">Stel je vraag aan je AI-tutor</p>
      </div>

      {/* Chat lijst */}
      <div className="flex-1 overflow-auto">
        {vakken.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-gray-900 mb-2">Nog geen vakken</h3>
            <p className="text-gray-500 mb-6">
              Voeg vakken toe om met je AI-tutors te chatten
            </p>
            <button
              onClick={onNieuwVak}
              className="px-6 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Vakken toevoegen
            </button>
          </div>
        ) : (
          <div>
            {vakken.map((vak) => {
              const isActive = activeVakId === vak.id;
              
              return (
                <button
                  key={vak.id}
                  onClick={() => onChatOpenen(vak)}
                  // Ik heb 'disabled={!isEnabled}' verwijderd zodat ALLES werkt
                  className={`w-full flex items-center gap-4 p-4 transition-colors text-left border-l-2 ${
                    isActive
                      ? "bg-[#5D64BE]/5 border-[#5D64BE]"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${vak.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-2xl">{vak.tutor.avatar}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 mb-1 truncate">
                      {vak.tutor.naam}
                    </div>
                    <div className="text-gray-500 truncate">{vak.naam}</div>
                  </div>

                  {/* Indicator (blauw bolletje als niet actief is optioneel, hier grijs) */}
                  {!isActive && (
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Plus knop onderaan */}
      {vakken.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          {/* Hier zou je eventueel nog een knop kunnen toevoegen */}
        </div>
      )}
    </div>
  );
}
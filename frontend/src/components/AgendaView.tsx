import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Mic,
  X,
  Clock,
  BookOpen,
  Edit,
} from "lucide-react";

type AgendaEvent = {
  id: string;
  title: string;
  subject: string;
  day: number; // 0-6 (ma-zo)
  startTime: number; // hour (8-20)
  duration: number; // in hours
  color: string;
  gradient: string;
  description?: string;
  location?: string;
};

export function AgendaView() {
  const [view, setView] = useState<"week" | "maand">("week");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  const days = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
  const dates = [25, 26, 27, 28, 29, 30, 1]; // Nov 25 - Dec 1
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

  const [events, setEvents] = useState<AgendaEvent[]>([
    {
      id: "1",
      title: "Biologie HW – H3",
      subject: "Biologie",
      day: 0,
      startTime: 9,
      duration: 1,
      color: "#FAAA75",
      gradient: "from-[#F57955] to-[#FAAA75]",
      description: "Hoofdstuk 3 oefeningen maken",
      location: "Thuis",
    },
    {
      id: "2",
      title: "Wiskunde B - Integralen",
      subject: "Wiskunde B",
      day: 1,
      startTime: 14,
      duration: 1,
      color: "#5D64BE",
      gradient: "from-[#4852A8] to-[#7B7FC7]",
      description: "Oefentoets integralen voorbereiden",
      location: "Bibliotheek",
    },
    {
      id: "3",
      title: "Engels Essay",
      subject: "Engels",
      day: 2,
      startTime: 16,
      duration: 1,
      color: "#90D5FE",
      gradient: "from-[#6BB6E8] to-[#B8E4FE]",
      description: "Essay over Shakespeare afmaken",
      location: "Thuis",
    },
    {
      id: "4",
      title: "Scheikunde Practicum",
      subject: "Scheikunde",
      day: 3,
      startTime: 10,
      duration: 2,
      color: "#F57955",
      gradient: "from-[#E85A3D] to-[#F99070]",
      description: "Lab experiment uitvoeren",
      location: "Lab 2.03",
    },
    {
      id: "5",
      title: "Natuurkunde Toets",
      subject: "Natuurkunde",
      day: 4,
      startTime: 11,
      duration: 1.5,
      color: "#5D64BE",
      gradient: "from-[#4852A8] to-[#7B7FC7]",
      description: "Toets mechanica",
      location: "Lokaal 1.12",
    },
  ]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: "1",
      type: "ai",
      text: "Hoi! Ik help je graag met je studieplanning. Wat wil je deze week bereiken?",
    },
    {
      id: "2",
      type: "user",
      text: "Kun je mijn weekplanning maken? Ik heb morgen een toets Engels.",
    },
    {
      id: "3",
      type: "ai",
      text: "Natuurlijk! Ik zie dat je morgen een Engels toets hebt. Ik zou aanraden om vandaag 2 uur te studeren. Zal ik dat voor je inplannen om 16:00?",
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatMessages([
        ...chatMessages,
        { id: Date.now().toString(), type: "user", text: message },
      ]);
      setMessage("");

      // Simulate AI response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "ai",
            text: "Ik heb dat voor je gepland! Check je agenda.",
          },
        ]);
      }, 1000);
    }
  };

  return (
    <div className="h-full flex w-full pr-4">
      {/* Agenda - links */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-1">Agenda</h1>
              <p className="text-gray-500">Week 48 • November 2025</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Week/Maand toggle */}
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => setView("week")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    view === "week"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView("maand")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    view === "maand"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Maand
                </button>
              </div>

              {/* Navigation */}
              <div className="flex gap-1">
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dag labels - sticky */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 sticky top-0 bg-white z-10">
          <div className="bg-white p-3 border-b border-gray-100"></div>
          {days.map((day, index) => (
            <div
              key={day}
              className="p-3 text-center border-r border-b border-gray-100 last:border-r-0 bg-white"
            >
              <div className="text-gray-500 mb-1 text-sm">{day}</div>
              <div
                className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center text-sm ${
                  index === 1 ? "bg-[#5D64BE] text-white" : "text-gray-900"
                }`}
              >
                {dates[index]}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 min-h-full">
            {/* Time labels & grid */}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                {/* Time label */}
                <div className="bg-white p-3 text-gray-500 text-right sticky left-0 border-r border-b border-gray-100">
                  {hour}:00
                </div>

                {/* Day cells */}
                {days.map((_, dayIndex) => (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className="bg-white p-3 relative min-h-[90px] border-r border-b border-gray-100 last:border-r-0"
                  >
                    {/* Events */}
                    {events
                      .filter(
                        (event) =>
                          event.day === dayIndex && event.startTime === hour
                      )
                      .map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`absolute bg-gradient-to-br ${event.gradient} rounded-xl p-2 text-white shadow-sm hover:shadow-md transition-all cursor-pointer text-left flex flex-col justify-start z-20`}
                          style={{
                            inset: "8px",
                            height: `calc(${event.duration * 90}px - 16px)`,
                          }}
                        >
                          <div className="text-xs font-semibold line-clamp-2 leading-tight">
                            {event.title}
                          </div>
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Planner - rechts */}
      <div className="w-[320px] border-l-2 border-gray-200 flex flex-col bg-gradient-to-b from-gray-50 to-white shadow-lg">
        {/* Header */}
        <div className="p-5 border-b-2 border-gray-200 bg-white">
          <h3 className="text-gray-900 mb-1">Planner</h3>
          <p className="text-gray-500">AI helpt je met studieplanning</p>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-auto scrollbar-hide p-5 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.type === "user"
                    ? "bg-white border-2 border-[#5D64BE]/30 text-gray-900 shadow-sm"
                    : "bg-gradient-to-br from-[#90D5FE] to-[#B8E4FE] text-white shadow-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-5 border-t-2 border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Typ een vraag..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/30 focus:border-[#5D64BE]/30"
            />
            <button className="p-3 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              <Mic className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="p-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div
              className={`bg-gradient-to-br ${selectedEvent.gradient} rounded-t-2xl p-6 text-white`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm opacity-90">
                  {selectedEvent.subject}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-2xl mb-4">{selectedEvent.title}</h2>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <Clock className="w-4 h-4" />
                <span>
                  {selectedEvent.startTime}:00 -{" "}
                  {selectedEvent.startTime + selectedEvent.duration}:00
                </span>
                <span className="mx-2">•</span>
                <span>{selectedEvent.duration} uur</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {selectedEvent.description && (
                <div>
                  <div className="text-gray-500 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Beschrijving
                  </div>
                  <p className="text-gray-900">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.location && (
                <div>
                  <div className="text-gray-500 mb-2">Locatie</div>
                  <p className="text-gray-900">{selectedEvent.location}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button className="flex-1 px-4 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Bewerken
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

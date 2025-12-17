import { useState } from "react";

// Importeer alle componenten
import { Sidebar } from "./components/Sidebar";
import { DashboardContent } from "./components/DashboardContent";
import { AgendaView } from "./components/AgendaView";
import { ProgressieView } from "./components/ProgressieView";
import { ProfielView } from "./components/ProfielView";
import { ZoekenView } from "./components/ZoekenView";
import { HelpView } from "./components/HelpView";
import { VakkenFlow } from "./components/VakkenFlow"; // Dit regelt jouw chats!

// Types definiëren (zodat TypeScript blij is)
export type AccentColor = {
  name: string;
  primary: string;
  light: string;
  gradient: string;
};

export type SidebarTheme = "light" | "dark" | "colored";

// De kleuren die je in ProfielView kunt kiezen
export const accentColors: AccentColor[] = [
  { name: "Indigo", primary: "#5D64BE", light: "#90D5FE", gradient: "from-[#5D64BE] to-[#90D5FE]" },
  { name: "Slate", primary: "#64748b", light: "#94a3b8", gradient: "from-[#64748b] to-[#94a3b8]" },
  { name: "Emerald", primary: "#10b981", light: "#6ee7b7", gradient: "from-[#10b981] to-[#6ee7b7]" },
  { name: "Teal", primary: "#14b8a6", light: "#5eead4", gradient: "from-[#14b8a6] to-[#5eead4]" },
  { name: "Rose", primary: "#e11d48", light: "#fda4af", gradient: "from-[#e11d48] to-[#fda4af]" },
  { name: "Amber", primary: "#d97706", light: "#fcd34d", gradient: "from-[#d97706] to-[#fcd34d]" },
  { name: "Violet", primary: "#7c3aed", light: "#c4b5fd", gradient: "from-[#7c3aed] to-[#c4b5fd]" },
  { name: "Cyan", primary: "#0891b2", light: "#67e8f9", gradient: "from-[#0891b2] to-[#67e8f9]" },
];

export default function App() {
  // De 'staat' van de app: welk scherm staat open? Welke kleur is gekozen?
  const [activeView, setActiveView] = useState<"home" | "vakken" | "agenda" | "progressie" | "profiel" | "zoeken" | "help">("home");
  const [darkMode, setDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState<AccentColor>(accentColors[0]);
  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>("light");

  return (
    <div className={`flex h-screen bg-gray-50 overflow-hidden ${darkMode ? "dark" : ""}`}>
      
      {/* 1. De Navigatiebalk links */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        accentColor={accentColor}
        sidebarTheme={sidebarTheme}
      />

      {/* 2. Het Hoofdscherm rechts */}
      <main className="flex-1 flex bg-white dark:bg-gray-900 overflow-hidden relative">
        
        {/* Hier kijken we welk scherm 'active' is en tonen we het juiste component */}
        
        {activeView === "home" && (
          <DashboardContent accentColor={accentColor} />
        )}

        {activeView === "vakken" && (
           // VakkenFlow regelt intern de lijst met vakken, toevoegen en de chat
           <VakkenFlow />
        )}

        {activeView === "agenda" && (
          <AgendaView />
        )}

        {activeView === "progressie" && (
          <ProgressieView />
        )}
        
        {activeView === "profiel" && (
          <ProfielView
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            accentColor={accentColor}
            onAccentColorChange={setAccentColor}
            sidebarTheme={sidebarTheme}
            onSidebarThemeChange={setSidebarTheme}
          />
        )}
        
        {activeView === "zoeken" && (
          <ZoekenView accentColor={accentColor} />
        )}

        {activeView === "help" && (
          <HelpView />
        )}

      </main>
    </div>
  );
}
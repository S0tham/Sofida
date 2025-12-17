import { Home, BookOpen, Calendar, TrendingUp, User, Search, HelpCircle } from 'lucide-react';
import type { AccentColor, SidebarTheme } from '../App';
import logoImage from '../assets/logo.png';
type Props = {
  activeView: 'home' | 'vakken' | 'agenda' | 'progressie' | 'profiel' | 'zoeken' | 'help';
  onNavigate: (view: 'home' | 'vakken' | 'agenda' | 'progressie' | 'profiel' | 'zoeken' | 'help') => void;
  accentColor: AccentColor;
  sidebarTheme: SidebarTheme;
};

export function Sidebar({ activeView, onNavigate, accentColor, sidebarTheme }: Props) {
  const menuItems = [
    { icon: Home, label: 'Home', view: 'home' as const },
    { icon: BookOpen, label: 'Vakken', view: 'vakken' as const },
    { icon: Calendar, label: 'Agenda', view: 'agenda' as const },
    { icon: TrendingUp, label: 'Progressie', view: 'progressie' as const },
    { icon: User, label: 'Profiel', view: 'profiel' as const },
    { icon: Search, label: 'Zoeken', view: 'zoeken' as const },
    { icon: HelpCircle, label: 'Help', view: 'help' as const },
  ];

  const getSidebarStyles = () => {
    if (sidebarTheme === 'dark') {
      return {
        bg: 'bg-gray-900',
        border: 'border-gray-800',
        text: 'text-gray-100',
        textMuted: 'text-gray-400',
        hoverBg: 'hover:bg-gray-800',
      };
    } else if (sidebarTheme === 'colored') {
      return {
        bg: '',
        border: 'border-white/10',
        text: 'text-gray-900',
        textMuted: 'text-gray-600',
        hoverBg: 'hover:bg-gray-100/50',
      };
    }
    // light (default)
    return {
      bg: 'bg-white',
      border: 'border-gray-100',
      text: 'text-gray-900',
      textMuted: 'text-gray-500',
      hoverBg: 'hover:bg-gray-50',
    };
  };

  const styles = getSidebarStyles();

  return (
    <aside 
      className={`w-[220px] ${styles.bg} border-r ${styles.border} flex flex-col`}
      style={
        sidebarTheme === 'colored'
          ? {
              background: `linear-gradient(to bottom right, ${accentColor.primary}15, ${accentColor.light}15)`,
            }
          : {}
      }
    >
      {/* Logo/Avatar */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logoImage} alt="Sophida Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <div className={styles.text}>Sophida</div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  item.view !== activeView
                    ? `${styles.textMuted} ${styles.hoverBg}`
                    : ''
                }`}
                style={
                  item.view === activeView
                    ? sidebarTheme === 'colored'
                      ? {
                          backgroundColor: `${accentColor.primary}30`,
                          color: accentColor.primary,
                        }
                      : sidebarTheme === 'dark'
                      ? {
                          backgroundColor: `${accentColor.primary}20`,
                          color: accentColor.primary,
                        }
                      : {
                          backgroundColor: `${accentColor.primary}10`,
                          color: accentColor.primary,
                        }
                    : {}
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className={`p-4 border-t ${styles.border}`}>
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{
              background: sidebarTheme === 'colored' 
                ? 'rgba(255, 255, 255, 0.2)'
                : `linear-gradient(to bottom right, ${accentColor.primary}, ${accentColor.light})`,
            }}
          >
            JD
          </div>
          <div className="flex-1 min-w-0">
            <div className={`${styles.text} truncate`}>Jan de Vries</div>
            <div className={`${styles.textMuted} truncate`}>Student</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
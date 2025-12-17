import { Search, Plus, Smile, Meh, Frown, Star, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import type { AccentColor } from '../App';

type Props = {
  accentColor: AccentColor;
};

export function DashboardContent({ accentColor }: Props) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [todos, setTodos] = useState([
    { id: 1, title: 'Wiskunde hoofdstuk 4 herhalen', completed: false },
    { id: 2, title: 'Engels essay afmaken', completed: true },
    { id: 3, title: 'Biologie aantekeningen maken', completed: false },
    { id: 4, title: 'Geschiedenisboek lezen (p. 45-67)', completed: false },
  ]);

  const moods = [
    { id: 'bad', label: 'Slecht', icon: Frown, color: '#F57955' },
    { id: 'okay', label: 'Oké', icon: Meh, color: '#FAAA75' },
    { id: 'good', label: 'Goed', icon: Smile, color: '#90D5FE' },
    { id: 'excellent', label: 'Top', icon: Star, color: accentColor.primary },
  ];

  const agendaItems = [
    { time: '09:00', title: 'Wiskunde - Toets Integralen', location: 'Lokaal 2.14' },
    { time: '11:00', title: 'Biologie - Groepsopdracht', location: 'Lab A' },
    { time: '14:30', title: 'Studiegroep Engels', location: 'Bibliotheek' },
  ];

  const completedCount = todos.filter(t => t.completed).length;
  const progress = (completedCount / todos.length) * 100;

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleSaveReflection = () => {
    if (selectedMood) {
      setReflectionSaved(true);
    }
  };

  const getResponseMessage = () => {
    switch (selectedMood) {
      case 'bad':
        return 'We zullen er voor zorgen dat het de volgende keer beter gaat. Blijf oefenen!';
      case 'okay':
        return 'Niet slecht! Met wat extra oefening ga je het zeker beter doen.';
      case 'good':
        return 'Goed gedaan, ga zo door!';
      case 'excellent':
        return 'Wat super gedaan! Je bent top bezig!';
      default:
        return '';
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('nl-NL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <>
      {/* Middle section - Main content */}
      <div className="flex-1 overflow-auto p-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-gray-900 mb-2 capitalize">{dateStr}</h1>
          <p className="text-gray-500 mb-8">Overzicht van je dag</p>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Zoeken..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
              />
            </div>
            <button className="px-5 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nieuwe notitie
            </button>
          </div>
        </div>

        {/* Section: Hoe ging je toets? */}
        {!reflectionSaved ? (
          <div>
            <h2 className="text-gray-900 mb-6">Hoe ging je toets?</h2>
            
            <div className="flex gap-3 mb-6">
              {moods.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className="flex-1 py-4 px-6 rounded-lg transition-all"
                    style={{
                      backgroundColor: selectedMood === mood.id ? `${mood.color}15` : 'transparent',
                      border: selectedMood === mood.id ? `2px solid ${mood.color}` : '2px solid transparent',
                    }}
                  >
                    <Icon 
                      className="w-6 h-6 mx-auto mb-2" 
                      style={{ color: mood.color }}
                    />
                    <div className="text-gray-700">{mood.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="mb-4">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Wat ging goed? Wat kon beter? (optioneel)"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 resize-none"
                rows={3}
              />
            </div>

            <button
              className="px-6 py-2.5 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: accentColor.primary,
              }}
              onClick={handleSaveReflection}
              disabled={!selectedMood}
              onMouseOver={(e) => {
                if (selectedMood) e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                if (selectedMood) e.currentTarget.style.opacity = '1';
              }}
            >
              Opslaan
            </button>
          </div>
        ) : (
          <div className="py-8 px-6 rounded-lg" style={{ backgroundColor: `${accentColor.primary}10` }}>
            <p className="text-gray-700 dark:text-gray-300">
              {getResponseMessage()}
            </p>
          </div>
        )}
      </div>

      {/* Right section - Agenda & To-do */}
      <div className="w-[360px] border-l border-gray-100 overflow-auto p-8">
        {/* Section: Agenda */}
        <div className="mb-12">
          <h3 className="text-gray-900 mb-6">Agenda</h3>
          
          <div className="space-y-4">
            {agendaItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-12 text-gray-500 pt-0.5">{item.time}</div>
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#5D64BE] mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">{item.title}</div>
                      <div className="text-gray-500">{item.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-8"></div>

        {/* Section: To-do vandaag */}
        <div>
          <h3 className="text-gray-900 mb-6">To-do vandaag</h3>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">{completedCount} van {todos.length} voltooid</span>
              <span className="text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColor.primary,
                }}
              />
            </div>
          </div>

          {/* Todo List */}
          <div className="space-y-3">
            {todos.map((todo) => (
              <button
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                {todo.completed ? (
                  <CheckCircle2 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: accentColor.primary }}
                  />
                ) : (
                  <Circle className="w-5 h-5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span className={todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                  {todo.title}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Add Button */}
          <button 
            className="w-full mt-4 py-2.5 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center gap-2"
            style={{
              borderColor: `${accentColor.primary}40`,
              color: accentColor.primary,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = `${accentColor.primary}10`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Plus className="w-4 h-4" />
            Nieuwe taak
          </button>
        </div>
      </div>
    </>
  );
}
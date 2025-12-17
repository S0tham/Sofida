import { Frown, Meh, Smile, Laugh } from 'lucide-react';
import { useState } from 'react';
// Zorg dat je React hier expliciet hebt voor de CSSProperties type-check
import React from 'react'; 

export function TestReflection() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');

  const moods = [
    { id: 'bad', label: 'Slecht', icon: Frown, color: '#F57955' },
    { id: 'okay', label: 'Oké', icon: Meh, color: '#FAAA75' },
    { id: 'good', label: 'Goed', icon: Smile, color: '#90D5FE' },
    { id: 'great', label: 'Top', icon: Laugh, color: '#5D64BE' },
  ];

  return (
    <div>
      {/* Section title */}
      <h2 className="text-gray-900 mb-6">Hoe ging je toets?</h2>
      
      {/* Mood buttons */}
      <div className="flex gap-3 mb-6">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;
          
          return (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`flex-1 flex flex-col items-center justify-center py-6 rounded-lg transition-all ${
                isSelected
                  ? 'ring-2 ring-offset-2'
                  : 'hover:bg-gray-50'
              }`}
              // --- HIER ZAT DE FOUT ---
              style={{
                backgroundColor: isSelected ? `${mood.color}15` : 'transparent',
                // We gebruiken de officiële CSS variabele van Tailwind:
                '--tw-ring-color': isSelected ? mood.color : 'transparent',
              } as React.CSSProperties} // <--- Deze toevoeging lost de rode streep op!
            >
              <Icon
                className="w-8 h-8 mb-2"
                style={{ color: mood.color }}
              />
              <span className="text-gray-700">{mood.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reflection text area */}
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="Wat vond je moeilijk of makkelijk? Wat zou je volgende keer anders doen?"
        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 resize-none"
        rows={4}
      />

      {/* Save button */}
      <div className="mt-4 flex justify-end">
        <button className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          Opslaan
        </button>
      </div>
    </div>
  );
}
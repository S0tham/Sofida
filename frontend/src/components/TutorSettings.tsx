import { useState } from 'react';
import { X, Info, Sparkles, Clock, Trash2 } from 'lucide-react';
// AANGEPAST: De import komt nu uit ./types om de cirkel te doorbreken
import type { Vak } from './types';

type Props = {
  vak: Vak;
  onClose: () => void;
};

export function TutorSettings({ vak, onClose }: Props) {
  const [activeSection, setActiveSection] = useState<'info' | 'personalisatie' | 'geschiedenis' | 'delete'>('info');
  const [naam, setNaam] = useState(vak.tutor.naam);
  const [instructies, setInstructies] = useState(vak.tutor.instructies);
  const [boek, setBoek] = useState(vak.tutor.boek);

  const sections = [
    { id: 'info' as const, label: 'Informatie', icon: Info },
    { id: 'personalisatie' as const, label: 'Personalisatie', icon: Sparkles },
    { id: 'geschiedenis' as const, label: 'Chatgeschiedenis', icon: Clock },
    { id: 'delete' as const, label: 'Delete', icon: Trash2 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        {/* Sidebar navigatie */}
        <div className="w-56 bg-gray-50 p-4 border-r border-gray-100">
          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : section.id === 'delete'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${vak.gradient} flex items-center justify-center`}>
                <span className="text-3xl">{vak.tutor.avatar}</span>
              </div>
              <div>
                <h2 className="text-gray-900">{vak.naam} tutor</h2>
                <p className="text-gray-500">{naam}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto p-6">
            {activeSection === 'info' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h3 className="text-gray-900 mb-4">Tutor informatie</h3>
                  <p className="text-gray-500 mb-6">
                    Pas de naam en instellingen van je tutor aan
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Naam</label>
                  <input
                    type="text"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Vak</label>
                  <input
                    type="text"
                    value={vak.naam}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {activeSection === 'personalisatie' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <h3 className="text-gray-900 mb-4">Personalisatie</h3>
                  <p className="text-gray-500 mb-6">
                    Pas aan hoe je tutor communiceert en welk studiemateriaal wordt gebruikt
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Instructies (system prompt)</label>
                  <textarea
                    value={instructies}
                    onChange={(e) => setInstructies(e.target.value)}
                    placeholder="Bijvoorbeeld: Wees geduldig en leg concepten stap voor stap uit..."
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 resize-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Boek input</label>
                  <input
                    type="text"
                    value={boek}
                    onChange={(e) => setBoek(e.target.value)}
                    placeholder="Bijvoorbeeld: Getal en Ruimte 5 VWO"
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
                  />
                </div>

                <button className="px-6 py-2.5 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors">
                  Opslaan
                </button>
              </div>
            )}

            {activeSection === 'geschiedenis' && (
              <div className="max-w-xl">
                <div>
                  <h3 className="text-gray-900 mb-4">Chatgeschiedenis</h3>
                  <p className="text-gray-500 mb-6">
                    Bekijk en beheer je eerdere gesprekken met deze tutor
                  </p>
                </div>

                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nog geen eerdere gesprekken</p>
                </div>
              </div>
            )}

            {activeSection === 'delete' && (
              <div className="max-w-xl">
                <div>
                  <h3 className="text-gray-900 mb-4">Vak verwijderen</h3>
                  <p className="text-gray-500 mb-6">
                    Dit verwijdert het vak en alle bijbehorende chatgeschiedenis. Deze actie kan niet ongedaan worden gemaakt.
                  </p>
                </div>

                <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Verwijder {vak.naam}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { User, Mail, Phone, Calendar, MapPin, GraduationCap, Settings, Bell, Lock, Palette, Check, Sidebar as SidebarIcon, Plus, X } from 'lucide-react';
import type { AccentColor, SidebarTheme } from '../App';
import { accentColors } from '../App';
import { useState } from 'react';

type Props = {
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  accentColor: AccentColor;
  onAccentColorChange: (color: AccentColor) => void;
  sidebarTheme: SidebarTheme;
  onSidebarThemeChange: (theme: SidebarTheme) => void;
};

export function ProfielView({ darkMode, onDarkModeChange, accentColor, onAccentColorChange, sidebarTheme, onSidebarThemeChange }: Props) {
  const [vakken, setVakken] = useState([
    'Wiskunde',
    'Nederlands',
    'Engels',
    'Natuurkunde',
    'Scheikunde',
    'Biologie',
  ]);
  const [newVak, setNewVak] = useState('');
  const [isAddingVak, setIsAddingVak] = useState(false);
  const [vakToDelete, setVakToDelete] = useState<string | null>(null);

  const addVak = () => {
    if (newVak.trim()) {
      setVakken([...vakken, newVak.trim()]);
      setNewVak('');
      setIsAddingVak(false);
    }
  };

  const confirmDeleteVak = () => {
    if (vakToDelete) {
      setVakken(vakken.filter(v => v !== vakToDelete));
      setVakToDelete(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Confirmation Modal */}
      {vakToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-900 dark:text-gray-100 mb-3">
              Vak verwijderen?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Weet je zeker dat je <strong className="text-gray-900 dark:text-gray-100">{vakToDelete}</strong> wilt verwijderen?
            </p>
            <p className="text-red-600 dark:text-red-400 mb-6">
              ⚠️ Let op: Alle chatgeschiedenis en data voor dit vak gaat verloren. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDeleteVak}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Ja, verwijderen
              </button>
              <button
                onClick={() => setVakToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 px-8 py-6">
        <h1 className="text-gray-900 dark:text-gray-100">Profiel</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Beheer je persoonlijke informatie en voorkeuren</p>
      </div>

      {/* Content */}
      <div className="px-8 py-6 max-w-4xl">
        {/* Profile Picture Section */}
        <div className="mb-8">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4">Profielfoto</h2>
          <div className="flex items-center gap-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl"
              style={{
                background: `linear-gradient(to bottom right, ${accentColor.primary}, ${accentColor.light})`,
              }}
            >
              JD
            </div>
            <div>
              <button 
                className="px-4 py-2 rounded-lg text-white transition-colors mr-2"
                style={{
                  backgroundColor: accentColor.primary,
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Foto wijzigen
              </button>
              <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Verwijderen
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8"></div>

        {/* Personal Information */}
        <div className="mb-8">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4">Persoonlijke gegevens</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-2">Voornaam</label>
                <input
                  type="text"
                  defaultValue="Jan"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
                />
              </div>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-2">Achternaam</label>
                <input
                  type="text"
                  defaultValue="de Vries"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                School e-mailadres
              </label>
              <input
                type="email"
                defaultValue="jan.devries@student.nl"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
              />
            </div>

            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Geboortedatum
              </label>
              <input
                type="date"
                defaultValue="2005-03-15"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8"></div>

        {/* Study Information */}
        <div className="mb-8">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4">
            <GraduationCap className="w-5 h-5 inline mr-2" />
            Studie informatie
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-2">Opleiding</label>
              <input
                type="text"
                defaultValue="VWO 5"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-2">School</label>
              <input
                type="text"
                defaultValue="Gymnasium Amsterdam Zuid"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
              />
            </div>
            
            {/* Vakken Section */}
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-3">Vakken</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {vakken.map((vak) => (
                  <div 
                    key={vak}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-2 group"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{vak}</span>
                    <button
                      onClick={() => setVakToDelete(vak)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {!isAddingVak && (
                  <button
                    onClick={() => setIsAddingVak(true)}
                    className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 flex items-center gap-2 transition-colors"
                    style={{
                      color: accentColor.primary,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Vak toevoegen
                  </button>
                )}
              </div>
              
              {isAddingVak && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVak}
                    onChange={(e) => setNewVak(e.target.value)}
                    placeholder="Vak naam..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addVak();
                      if (e.key === 'Escape') {
                        setIsAddingVak(false);
                        setNewVak('');
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={addVak}
                    className="px-4 py-2.5 rounded-lg text-white transition-colors"
                    style={{
                      backgroundColor: accentColor.primary,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Toevoegen
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingVak(false);
                      setNewVak('');
                    }}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8"></div>

        {/* Preferences */}
        <div className="mb-8">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4">
            <Settings className="w-5 h-5 inline mr-2" />
            Voorkeuren
          </h2>
          <div className="space-y-4">
            {/* Accent Color Selection */}
            <div className="py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="mb-3">
                <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4" />
                  Accentkleur
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Kies een kleur voor de interface
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {accentColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => onAccentColorChange(color)}
                    className="relative group"
                    title={color.name}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg transition-all border-2"
                      style={{
                        background: `linear-gradient(to bottom right, ${color.primary}, ${color.light})`,
                        borderColor: accentColor.name === color.name ? color.primary : 'transparent',
                      }}
                    >
                      {accentColor.name === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Theme Selection */}
            <div className="py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="mb-3">
                <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                  <SidebarIcon className="w-4 h-4" />
                  Navigatie Thema
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Kies een thema voor de navigatiebalk
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onSidebarThemeChange('light')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    sidebarTheme === 'light'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded mx-auto mb-2"></div>
                  <div className="text-gray-900 dark:text-gray-100">Licht</div>
                </button>
                <button
                  onClick={() => onSidebarThemeChange('dark')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    sidebarTheme === 'dark'
                      ? 'border-gray-900 bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-900 rounded mx-auto mb-2"></div>
                  <div className="text-gray-900 dark:text-gray-100">Donker</div>
                </button>
                <button
                  onClick={() => onSidebarThemeChange('colored')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    sidebarTheme === 'colored'
                      ? 'border-gray-900 bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded mx-auto mb-2"
                    style={{
                      background: `linear-gradient(to bottom right, ${accentColor.primary}30, ${accentColor.light}30)`,
                    }}
                  ></div>
                  <div className="text-gray-900 dark:text-gray-100">Gekleurd</div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Meldingen
                </div>
                <div className="text-gray-500 dark:text-gray-400">Ontvang updates over deadlines en nieuwe berichten</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5D64BE]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5D64BE]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail notificaties
                </div>
                <div className="text-gray-500 dark:text-gray-400">Ontvang dagelijkse samenvattingen per e-mail</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5D64BE]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5D64BE]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Donkere modus
                </div>
                <div className="text-gray-500 dark:text-gray-400">Gebruik een donker kleurenschema</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={darkMode}
                  onChange={(e) => onDarkModeChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5D64BE]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5D64BE]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8"></div>

        {/* Security */}
        <div className="mb-8">
          <h2 className="text-gray-900 dark:text-gray-100 mb-4">
            <Lock className="w-5 h-5 inline mr-2" />
            Beveiliging
          </h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-gray-900 dark:text-gray-100">Wachtwoord wijzigen</div>
              <div className="text-gray-500 dark:text-gray-400">Laatst gewijzigd: 2 maanden geleden</div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-gray-900 dark:text-gray-100">Twee-factor authenticatie</div>
              <div className="text-gray-500 dark:text-gray-400">Voeg een extra beveiligingslaag toe</div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-gray-900 dark:text-gray-100">Actieve sessies</div>
              <div className="text-gray-500 dark:text-gray-400">Bekijk en beheer je apparaten</div>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <button 
            className="px-6 py-2.5 rounded-lg text-white transition-colors"
            style={{
              backgroundColor: accentColor.primary,
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Wijzigingen opslaan
          </button>
          <button className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Search, BookOpen, Calendar, MessageSquare, TrendingUp, Clock, FileText, ArrowRight } from 'lucide-react';
import type { AccentColor } from '../App';

type Props = {
  accentColor: AccentColor;
};

export function ZoekenView({ accentColor }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock search results
  const recentSearches = [
    'Wiskunde formules',
    'Natuurkunde toets hoofdstuk 3',
    'Geschiedenis WO2',
    'Engels grammatica',
  ];

  const searchResults = [
    {
      type: 'vak',
      title: 'Wiskunde - Goniometrie',
      description: 'Je hebt 3 chats en 2 toetsen voor dit onderwerp',
      icon: BookOpen,
      color: accentColor.primary,
    },
    {
      type: 'chat',
      title: 'Chat: Integraalrekening uitleg',
      description: 'Laatste activiteit: vandaag om 14:30',
      icon: MessageSquare,
      color: accentColor.light,
    },
    {
      type: 'agenda',
      title: 'Toets Natuurkunde: Mechanica',
      description: 'Vrijdag 15 december om 10:30',
      icon: Calendar,
      color: '#F57955',
    },
    {
      type: 'reflectie',
      title: 'Toetsreflectie Wiskunde - 8.5',
      description: 'Afgenomen op 5 december 2024',
      icon: TrendingUp,
      color: '#FAAA75',
    },
    {
      type: 'chat',
      title: 'Chat: Vergelijkingen oplossen',
      description: 'Laatste activiteit: gisteren om 16:45',
      icon: MessageSquare,
      color: accentColor.light,
    },
    {
      type: 'vak',
      title: 'Natuurkunde - Beweging en kracht',
      description: 'Je hebt 5 chats en 1 toets voor dit onderwerp',
      icon: BookOpen,
      color: accentColor.primary,
    },
  ];

  const quickLinks = [
    { label: 'Alle vakken', icon: BookOpen },
    { label: 'Recente chats', icon: MessageSquare },
    { label: 'Komende toetsen', icon: Calendar },
    { label: 'Toetsresultaten', icon: TrendingUp },
  ];

  return (
    <div className="flex-1 overflow-auto">
      {/* Header with Search Bar */}
      <div className="border-b border-gray-100 px-8 py-6">
        <h1 className="text-gray-900 mb-4">Zoeken</h1>
        
        {/* Large Search Input */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek in vakken, chats, agenda, en meer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 max-w-4xl">
        {!searchQuery ? (
          <>
            {/* Quick Links */}
            <div className="mb-8">
              <h2 className="text-gray-900 mb-4">Snelle toegang</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((link, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#5D64BE]/10 flex items-center justify-center text-[#5D64BE]">
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className="text-gray-900">{link.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 mb-8"></div>

            {/* Recent Searches */}
            <div>
              <h2 className="text-gray-900 mb-4">
                <Clock className="w-5 h-5 inline mr-2" />
                Recente zoekopdrachten
              </h2>
              <div className="space-y-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(search)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{search}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Search Results */}
            <div className="mb-4">
              <div className="text-gray-500">
                {searchResults.length} resultaten voor &quot;{searchQuery}&quot;
              </div>
            </div>

            <div className="space-y-3">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-start gap-4 px-4 py-4 rounded-lg border border-gray-200 hover:border-[#5D64BE]/30 hover:bg-gray-50 transition-all text-left"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${result.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <result.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 mb-1">{result.title}</div>
                    <div className="text-gray-500">{result.description}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
                </button>
              ))}
            </div>

            {/* No more results */}
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500">Alle resultaten weergegeven</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
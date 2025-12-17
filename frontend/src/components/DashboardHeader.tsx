import { Search, Plus } from 'lucide-react';

export function DashboardHeader() {
  const today = new Date(2025, 10, 26); // November 26, 2025
  const formattedDate = today.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div>
      {/* Title & subtitle */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-1 capitalize">{formattedDate}</h1>
        <p className="text-gray-500">Overzicht van je dag</p>
      </div>

      {/* Search bar & action button */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek in je notities, agenda of taken..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20"
          />
        </div>
        <button className="px-5 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nieuwe notitie
        </button>
      </div>
    </div>
  );
}

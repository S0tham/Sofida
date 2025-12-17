import { useState } from 'react';
import { Check } from 'lucide-react';
// DEZE REGEL IS AANGEPAST: We halen Vak nu uit ./types
import type { Vak } from './types'; 

type Props = {
  bestaandeVakken: Vak[];
  onToevoegen: (vakken: Vak[]) => void;
};

export function VakkenToevoegen({ bestaandeVakken, onToevoegen }: Props) {
  const beschikbareVakken: Vak[] = [
    // Algemene vakken
    { id: 'nederlands', naam: 'Nederlands', categorie: 'Algemene vakken', gradient: 'from-[#5D64BE] to-[#8B7FC7]', tutor: { naam: 'Sophie', avatar: '👩‍🏫', instructies: '', boek: '' } },
    { id: 'engels', naam: 'Engels', categorie: 'Algemene vakken', gradient: 'from-[#90D5FE] to-[#6BB6E8]', tutor: { naam: 'James', avatar: '👨‍🏫', instructies: '', boek: '' } },
    { id: 'maatschappij', naam: 'Maatschappij', categorie: 'Algemene vakken', gradient: 'from-[#FAAA75] to-[#F8926D]', tutor: { naam: 'Lisa', avatar: '👩‍💼', instructies: '', boek: '' } },
    
    // N&G
    { id: 'scheikunde-ng', naam: 'Scheikunde', categorie: 'Natuur & Gezondheid (N&G)', gradient: 'from-[#F57955] to-[#E85A3D]', tutor: { naam: 'Tom', avatar: '🧑‍🔬', instructies: '', boek: '' } },
    { id: 'natuurkunde-ng', naam: 'Natuurkunde', categorie: 'Natuur & Gezondheid (N&G)', gradient: 'from-[#5D64BE] to-[#4852A8]', tutor: { naam: 'David', avatar: '👨‍🔬', instructies: '', boek: '' } },
    { id: 'biologie-ng', naam: 'Biologie', categorie: 'Natuur & Gezondheid (N&G)', gradient: 'from-[#6BCF7F] to-[#4CAF50]', tutor: { naam: 'Emma', avatar: '👩‍⚕️', instructies: '', boek: '' } },
    { id: 'wiskunde-b-ng', naam: 'Wiskunde B', categorie: 'Natuur & Gezondheid (N&G)', gradient: 'from-[#90D5FE] to-[#5D9ED9]', tutor: { naam: 'Joost', avatar: '🧮', instructies: '', boek: '' } },
    
    // N&T
    { id: 'natuurkunde-nt', naam: 'Natuurkunde', categorie: 'Natuur & Techniek (N&T)', gradient: 'from-[#5D64BE] to-[#4852A8]', tutor: { naam: 'David', avatar: '👨‍🔬', instructies: '', boek: '' } },
    { id: 'scheikunde-nt', naam: 'Scheikunde', categorie: 'Natuur & Techniek (N&T)', gradient: 'from-[#F57955] to-[#E85A3D]', tutor: { naam: 'Tom', avatar: '🧑‍🔬', instructies: '', boek: '' } },
    { id: 'wiskunde-nt', naam: 'Wiskunde', categorie: 'Natuur & Techniek (N&T)', gradient: 'from-[#90D5FE] to-[#5D9ED9]', tutor: { naam: 'Joost', avatar: '🧮', instructies: '', boek: '' } },
  ];

  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(
    new Set(bestaandeVakken.map(v => v.id))
  );

  const categorieën = [
    'Algemene vakken',
    'Natuur & Gezondheid (N&G)',
    'Natuur & Techniek (N&T)',
  ];

  const toggleVak = (vakId: string) => {
    const nieuweSelectie = new Set(geselecteerd);
    if (nieuweSelectie.has(vakId)) {
      nieuweSelectie.delete(vakId);
    } else {
      nieuweSelectie.add(vakId);
    }
    setGeselecteerd(nieuweSelectie);
  };

  const handleToevoegen = () => {
    const geselecteerdeVakken = beschikbareVakken.filter(vak => geselecteerd.has(vak.id));
    onToevoegen(geselecteerdeVakken);
  };

  return (
    <div className="h-full w-full overflow-auto p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-gray-900 mb-2">Vakken toevoegen</h1>
          <p className="text-gray-500">Selecteer de vakken waar je hulp bij nodig hebt</p>
        </div>
        <button
          onClick={handleToevoegen}
          disabled={geselecteerd.size === 0}
          className="px-6 py-3 bg-[#5D64BE] text-white rounded-lg hover:bg-[#5D64BE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Toevoegen ({geselecteerd.size})
        </button>
      </div>

      {/* Vakken per categorie */}
      <div className="space-y-12">
        {categorieën.map((categorie) => (
          <div key={categorie}>
            <h2 className="text-gray-900 mb-6">{categorie}</h2>
            <div className="grid grid-cols-5 gap-4">
              {beschikbareVakken
                .filter(vak => vak.categorie === categorie)
                .map((vak) => {
                  const isSelected = geselecteerd.has(vak.id);
                  return (
                    <button
                      key={vak.id}
                      onClick={() => toggleVak(vak.id)}
                      className="relative group"
                    >
                      <div
                        className={`aspect-square rounded-xl bg-gradient-to-br transition-all ${vak.gradient} ${
                          isSelected
                            ? 'ring-4 ring-offset-2 ring-[#5D64BE]'
                            : 'hover:scale-105'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#5D64BE]" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center text-gray-900">{vak.naam}</div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
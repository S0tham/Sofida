export function AgendaSection() {
  const agendaItems = [
    { id: 1, time: '09:00', title: 'Wiskunde - Hoofdstuk 5', type: 'les', color: '#5D64BE' },
    { id: 2, time: '10:15', title: 'Nederlands - Boekbespreking', type: 'les', color: '#90D5FE' },
    { id: 3, time: '13:00', title: 'Scheikunde toets', type: 'toets', color: '#F57955' },
    { id: 4, time: '15:30', title: 'Studie-uur bibliotheek', type: 'studie', color: '#FAAA75' },
  ];

  return (
    <div>
      {/* Section title */}
      <h2 className="text-gray-900 mb-6">Agenda</h2>
      
      {/* Timeline */}
      <div className="space-y-4">
        {agendaItems.map((item) => (
          <div key={item.id} className="flex items-start gap-4">
            {/* Time */}
            <div className="w-16 text-gray-500 pt-0.5">{item.time}</div>
            
            {/* Indicator line */}
            <div className="flex flex-col items-center pt-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              {agendaItems[agendaItems.length - 1].id !== item.id && (
                <div className="w-0.5 h-8 bg-gray-100 mt-1"></div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="text-gray-900">{item.title}</div>
              <div className="text-gray-500 capitalize">{item.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

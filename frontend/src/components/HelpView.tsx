import { HelpCircle, BookOpen, MessageSquare, Video, FileText, Mail, ExternalLink, ChevronRight } from 'lucide-react';

export function HelpView() {
  const faqItems = [
    {
      category: 'Aan de slag',
      questions: [
        { q: 'Hoe voeg ik een nieuw vak toe?', a: 'Ga naar Vakken en klik op de "+ Vak toevoegen" knop. Vul de vaknaam en eventuele kleur in.' },
        { q: 'Hoe start ik een chat met de AI tutor?', a: 'Selecteer een vak en klik op "Nieuwe chat". Je kunt direct beginnen met het stellen van vragen.' },
        { q: 'Kan ik mijn agenda synchroniseren?', a: 'Ja, ga naar Instellingen en verbind je schoolagenda via de kalender-integratie.' },
      ],
    },
    {
      category: 'AI Tutor',
      questions: [
        { q: 'Hoe werkt de AI tutor?', a: 'De AI tutor gebruikt geavanceerde machine learning om je vragen te beantwoorden en aangepaste uitleg te geven.' },
        { q: 'Kan ik de toon van de tutor aanpassen?', a: 'Ja, in de tutor-instellingen kun je de toon wijzigen naar formeel, vriendelijk of didactisch.' },
        { q: 'Worden mijn chats opgeslagen?', a: 'Ja, alle chats worden automatisch opgeslagen zodat je ze later kunt terugvinden.' },
      ],
    },
    {
      category: 'Toetsen & Reflectie',
      questions: [
        { q: 'Hoe voeg ik een toetsreflectie toe?', a: 'Na een toets verschijnt er een optie om een reflectie toe te voegen. Je kunt ook handmatig reflecties aanmaken.' },
        { q: 'Kan ik mijn progressie per vak zien?', a: 'Ja, ga naar het Progressie dashboard voor gedetailleerde statistieken en grafieken per vak.' },
        { q: 'Hoe werken de leerdoelen?', a: 'Je kunt leerdoelen instellen per vak en je voortgang wordt automatisch bijgehouden.' },
      ],
    },
  ];

  const resources = [
    {
      title: 'Video tutorials',
      description: 'Bekijk onze uitgebreide video-tutorials',
      icon: Video,
      color: 'from-[#5D64BE] to-[#90D5FE]',
    },
    {
      title: 'Gebruikershandleiding',
      description: 'Lees de complete handleiding',
      icon: BookOpen,
      color: 'from-[#90D5FE] to-[#90D5FE]',
    },
    {
      title: 'Community forum',
      description: 'Stel vragen aan andere gebruikers',
      icon: MessageSquare,
      color: 'from-[#F57955] to-[#FAAA75]',
    },
    {
      title: 'Documentatie',
      description: 'Technische documentatie voor gevorderden',
      icon: FileText,
      color: 'from-[#FAAA75] to-[#FFF1D7]',
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-gray-100 px-8 py-6">
        <h1 className="text-gray-900">Help & ondersteuning</h1>
        <p className="text-gray-500 mt-1">Vind antwoorden op je vragen en leer meer over StudyHub</p>
      </div>

      {/* Content */}
      <div className="px-8 py-6 max-w-4xl">
        {/* Search Help */}
        <div className="mb-8">
          <div className="relative">
            <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Waar kunnen we je mee helpen?"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5D64BE]/20 focus:border-[#5D64BE]"
            />
          </div>
        </div>

        {/* Resources */}
        <div className="mb-8">
          <h2 className="text-gray-900 mb-4">Hulpbronnen</h2>
          <div className="grid grid-cols-2 gap-4">
            {resources.map((resource, idx) => (
              <button
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#5D64BE]/30 hover:bg-gray-50 transition-all text-left"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${resource.color} flex items-center justify-center text-white flex-shrink-0`}>
                  <resource.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 mb-1">{resource.title}</div>
                  <div className="text-gray-500">{resource.description}</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-8"></div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-gray-900 mb-4">Veelgestelde vragen</h2>
          
          {faqItems.map((category, catIdx) => (
            <div key={catIdx} className="mb-6">
              <h3 className="text-gray-900 mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.questions.map((item, qIdx) => (
                  <details key={qIdx} className="group">
                    <summary className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                      <span className="text-gray-700">{item.q}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-4 py-3 text-gray-600 bg-gray-50 rounded-b-lg border-x border-b border-gray-200 -mt-2">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-gray-100 mb-8"></div>

        {/* Contact Support */}
        <div className="mb-8">
          <h2 className="text-gray-900 mb-4">Nog steeds vragen?</h2>
          <div className="bg-gradient-to-br from-[#5D64BE]/5 to-[#90D5FE]/5 rounded-xl p-6 border border-[#5D64BE]/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#5D64BE] to-[#90D5FE] flex items-center justify-center text-white flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-1">Neem contact op met support</h3>
                <p className="text-gray-600 mb-4">
                  Ons team staat klaar om je te helpen. We reageren meestal binnen 24 uur.
                </p>
                <button className="px-5 py-2.5 rounded-lg bg-[#5D64BE] text-white hover:bg-[#5D64BE]/90 transition-colors">
                  Stuur een bericht
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <div className="text-gray-900 mb-1">500+</div>
            <div className="text-gray-500">Hulpartikelen</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <div className="text-gray-900 mb-1">&lt; 24u</div>
            <div className="text-gray-500">Responstijd</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <div className="text-gray-900 mb-1">98%</div>
            <div className="text-gray-500">Tevredenheid</div>
          </div>
        </div>
      </div>
    </div>
  );
}
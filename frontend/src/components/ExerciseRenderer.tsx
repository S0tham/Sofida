import { useState } from "react";

// Types definiëren voor TypeScript
interface ExerciseContent {
  question?: string;
  sentence?: string;
  prompt?: string;
  options?: string[];
  word_limit?: { min: number; max: number };
}

interface ExerciseProps {
  exercise: {
    type: string;
    content: ExerciseContent;
    instructions?: string;
  };
  onSubmit: (answer: string) => void;
  isLoading: boolean;
}

export default function ExerciseRenderer({ exercise, onSubmit, isLoading }: ExerciseProps) {
  const [answer, setAnswer] = useState("");
  const { type, content, instructions } = exercise;

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmit(answer);
    setAnswer(""); 
  };

  // --- Weergave: Multiple Choice ---
  if (type === "mcq" || type === "reading") {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase">Oefening</span>
            <h3 className="font-semibold text-gray-800">Meerkeuze</h3>
        </div>
        
        <p className="text-gray-600 mb-4 text-sm italic">{instructions}</p>
        <p className="font-medium text-lg mb-6 text-gray-900">{content.question}</p>
        
        <div className="space-y-2">
          {content.options?.map((opt, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => onSubmit(opt)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-gray-700 font-medium active:scale-[0.99]"
            >
              <span className="inline-block w-6 font-bold text-blue-500">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Weergave: Gapfill (Invuloefening) ---
  if (type === "gapfill") {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase">Grammatica</span>
            <h3 className="font-semibold text-gray-800">Invuloefening</h3>
        </div>

        <p className="text-gray-600 mb-4 text-sm italic">{instructions}</p>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-4 border border-gray-100 text-center">
            <p className="text-xl font-mono text-gray-800">{content.sentence}</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Typ het woord..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !answer.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            Check
          </button>
        </div>
      </div>
    );
  }

  // --- Weergave: Schrijfopdracht ---
  if (type === "writing") {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mt-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase">Schrijven</span>
            <h3 className="font-semibold text-gray-800">Opdracht</h3>
        </div>

        <p className="text-gray-600 mb-2 text-sm italic">{instructions}</p>
        <p className="font-medium mb-4 text-gray-900">{content.prompt}</p>
        
        {content.word_limit && (
           <p className="text-xs text-gray-400 mb-3 uppercase font-bold tracking-wide">
             Lengte: {content.word_limit.min} - {content.word_limit.max} woorden
           </p>
        )}

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 text-gray-800"
          placeholder="Typ hier je tekst..."
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !answer.trim()}
          className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
        >
          Inleveren voor Feedback
        </button>
      </div>
    );
  }

  return <div className="p-4 text-red-500">Onbekend oefeningstype: {type}</div>;
}
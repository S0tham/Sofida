import { CheckCircle2, Circle, Plus } from 'lucide-react';
import { useState } from 'react';

export function TodoSection() {
  const [todos, setTodos] = useState([
    { id: 1, title: 'Wiskunde huiswerk H4', completed: false },
    { id: 2, title: 'Inschrijven herkansing', completed: true },
    { id: 3, title: 'Boekverslag Engels inleveren', completed: false },
  ]);

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div>
      <h2 className="text-gray-900 mb-6">To-do lijst</h2>
      <div className="space-y-3">
        {todos.map((todo) => (
          <button
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left bg-white"
          >
            {todo.completed ? (
              <CheckCircle2 className="w-5 h-5 text-[#5D64BE]" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300" />
            )}
            <span className={todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
              {todo.title}
            </span>
          </button>
        ))}
        <button className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#5D64BE] hover:text-[#5D64BE] transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Taak toevoegen
        </button>
      </div>
    </div>
  );
}
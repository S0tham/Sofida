import { DashboardHeader } from './DashboardHeader';
import { TestReflection } from './TestReflection';
import { AgendaSection } from './AgendaSection';
import { TodoSection } from './TodoSection';

export function Dashboard() {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main content area - single white panel */}
      <main className="flex-1 bg-white overflow-auto">
        <div className="max-w-5xl mx-auto px-12 py-10">
          <DashboardHeader />
          
          {/* Horizontal divider */}
          <div className="h-px bg-gray-100 my-10"></div>
          
          <TestReflection />
          
          {/* Horizontal divider */}
          <div className="h-px bg-gray-100 my-10"></div>
          
          <AgendaSection />
          
          {/* Horizontal divider */}
          <div className="h-px bg-gray-100 my-10"></div>
          
          <TodoSection />
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { TaskListFull } from '../components/tasks/TaskListFull';
import { EisenhowerMatrix } from '../components/tasks/EisenhowerMatrix';
import { TaskAnalyticsCharts } from '../components/tasks/TaskAnalyticsCharts';
import { List, LayoutGrid, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'list' | 'matrix' | 'analytics';

export function Tasks() {
  const [tab, setTab] = useState<Tab>('list');

  const tabs = [
    { id: 'list' as Tab, label: 'List', icon: List, description: 'View and manage all your tasks' },
    { id: 'matrix' as Tab, label: 'Eisenhower Matrix', icon: LayoutGrid, description: 'Prioritize by urgency and importance' },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3, description: 'Track productivity metrics' },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-h1">Tasks</h1>
        <p className="text-body mt-2 max-w-2xl">
          Multi-level tasks, Eisenhower matrix, time tracking, and productivity analytics. 
          Organize your work and focus on what matters most.
        </p>
      </div>

      {/* Tab Navigation - Underline Style */}
      <div className="border-b border-border mb-8">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-fast',
                tab === id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-fg-muted hover:text-foreground hover:border-border'
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tab === 'list' && <TaskListFull />}
        {tab === 'matrix' && <EisenhowerMatrix />}
        {tab === 'analytics' && <TaskAnalyticsCharts />}
      </div>
    </div>
  );
}

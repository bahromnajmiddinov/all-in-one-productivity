import { useState } from 'react';
import { TaskListFull } from '../components/tasks/TaskListFull';
import { EisenhowerMatrix } from '../components/tasks/EisenhowerMatrix';
import { TaskAnalyticsCharts } from '../components/tasks/TaskAnalyticsCharts';
import { List, LayoutGrid, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

type Tab = 'list' | 'matrix' | 'analytics';

export function Tasks() {
  const [tab, setTab] = useState<Tab>('list');

  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="mb-8">
        <h1 className="text-h1">Tasks</h1>
        <p className="text-body mt-1">
          Multi-level tasks, Eisenhower matrix, time tracking, and productivity analytics.
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: 'list' as Tab, label: 'List', icon: List },
          { id: 'matrix' as Tab, label: 'Eisenhower Matrix', icon: LayoutGrid },
          { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-smooth',
              tab === id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-fg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'list' && <TaskListFull />}
      {tab === 'matrix' && <EisenhowerMatrix />}
      {tab === 'analytics' && <TaskAnalyticsCharts />}
    </div>
  );
}

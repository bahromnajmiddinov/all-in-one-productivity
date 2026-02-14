import { useEffect, useState } from 'react';
import { taskApi } from '../../api';
import { TaskItem } from '../TaskItem';
import type { EisenhowerMatrix as EisenhowerMatrixType, Task } from '../../types';
import { cn } from '../../lib/utils';

const QUADRANTS = [
  { key: 'urgent_important', title: 'Urgent & Important', className: 'border-red-500/40 bg-red-500/5' },
  { key: 'urgent_not_important', title: 'Urgent, Not Important', className: 'border-amber-500/40 bg-amber-500/5' },
  { key: 'not_urgent_important', title: 'Not Urgent & Important', className: 'border-emerald-500/40 bg-emerald-500/5' },
  { key: 'not_urgent_not_important', title: 'Not Urgent, Not Important', className: 'border-border bg-bg-subtle/50' },
] as const;

export function EisenhowerMatrix() {
  const [data, setData] = useState<EisenhowerMatrixType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getEisenhower().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await taskApi.completeTask(id);
      taskApi.getEisenhower().then((res) => setData(res.data));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p className="text-body text-fg-muted">Loading matrix...</p>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADRANTS.map(({ key, title, className }) => (
        <div
          key={key}
          className={cn(
            'rounded-[var(--radius)] border-2 p-4 min-h-[200px]',
            className
          )}
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
          <ul className="space-y-1">
            {(data[key] || []).map((task: Task) => (
              <li key={task.id}>
                <TaskItem task={task} onComplete={handleComplete} />
              </li>
            ))}
          </ul>
          {(!data[key] || data[key].length === 0) && (
            <p className="text-caption text-fg-muted py-4">No tasks</p>
          )}
        </div>
      ))}
    </div>
  );
}

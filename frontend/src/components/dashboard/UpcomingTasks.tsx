import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskApi } from '../../api';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getUpcoming().then((res) => {
      setTasks(Array.isArray(res.data) ? res.data : (res.data as any).results ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-caption text-fg-muted">Loading...</div>;
  if (tasks.length === 0) return <p className="text-caption text-fg-muted">No upcoming tasks.</p>;

  const formatDate = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-h3">Upcoming</h3>
      <ul className="space-y-2">
        {tasks.slice(0, 5).map((task) => (
          <li key={task.id} className="flex items-center justify-between text-sm gap-2">
            <span className={cn(
              'truncate',
              task.status === 'completed' ? 'line-through text-fg-muted' : 'text-foreground'
            )}>
              {task.title}
            </span>
            <span className="text-caption shrink-0">{task.due_date && formatDate(task.due_date)}</span>
          </li>
        ))}
      </ul>
      {tasks.length > 5 && (
        <Link
          to="/projects"
          className="text-xs font-medium text-foreground hover:text-fg-muted transition-smooth inline-flex items-center gap-1"
        >
          View all
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      )}
    </div>
  );
}

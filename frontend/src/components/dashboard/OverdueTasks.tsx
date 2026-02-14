import { useEffect, useState } from 'react';
import { taskApi } from '../../api';
import { TaskItem } from '../TaskItem';
import { AlertCircle } from 'lucide-react';
import type { Task } from '../../types';

export function OverdueTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getOverdue().then((res) => {
      setTasks(Array.isArray(res.data) ? res.data : (res.data as any).results ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await taskApi.completeTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error('Failed to complete task', e);
    }
  };

  if (loading) return <div className="text-caption text-fg-muted">Loading...</div>;
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="size-4 text-red-500" strokeWidth={1.5} />
        <h2 className="text-h3 text-red-500 dark:text-red-400">Overdue</h2>
      </div>
      <ul className="space-y-0.5">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onComplete={handleComplete} />
        ))}
      </ul>
    </div>
  );
}

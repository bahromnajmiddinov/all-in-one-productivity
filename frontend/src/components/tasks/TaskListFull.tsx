import { useEffect, useState } from 'react';
import { taskApi } from '../../api';
import { TaskItem } from '../TaskItem';
import { TaskForm } from './TaskForm';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ChevronDown, ChevronRight, Plus, CheckSquare } from 'lucide-react';
import type { Task } from '../../types';

export function TaskListFull() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'inbox' | 'active' | 'completed'>('all');

  const load = () => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.status = filter;
    taskApi.getTasks(params).then((res) => {
      const data = res.data;
      setTasks(Array.isArray(data) ? data : (data as any).results ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [filter]);

  const handleComplete = async (id: string) => {
    try {
      await taskApi.completeTask(id);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <p className="text-body text-fg-muted">Loading tasks...</p>;

  const renderTask = (task: Task, depth = 0) => (
    <div key={task.id} className={depth > 0 ? 'ml-6 border-l border-border pl-3' : ''}>
      <div className="flex items-center gap-1 py-0.5">
        {(task.subtasks?.length ?? 0) > 0 ? (
          <button
            type="button"
            onClick={() => toggleExpand(task.id)}
            className="p-0.5 text-fg-muted hover:text-foreground"
          >
            {expanded.has(task.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="flex-1 min-w-0">
          <TaskItem task={task} onComplete={handleComplete} onEdit={(t) => { setEditingTask(t); setShowForm(true); }} />
        </div>
      </div>
      {expanded.has(task.id) && task.subtasks?.length
        ? task.subtasks.map((st) => renderTask(st, depth + 1))
        : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'inbox', 'active', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
        <Button onClick={() => { setShowForm(true); setEditingTask(null); }} size="sm">
          <Plus className="size-4 mr-1" /> Add task
        </Button>
      </div>

      {showForm && (
        <TaskForm
          initial={editingTask ?? undefined}
          onSave={async (data: Partial<Task>) => {
            try {
              if (editingTask) await taskApi.updateTask(editingTask.id, data);
              else await taskApi.createTask(data);
              setShowForm(false);
              setEditingTask(null);
              load();
            } catch (e) {
              console.error(e);
            }
          }}
          onCancel={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="size-10" strokeWidth={1} />}
          title="No tasks"
          description="Create a task or filter differently."
          action={<Button onClick={() => { setEditingTask(null); setShowForm(true); }}><Plus className="size-4 mr-1" /> Add task</Button>}
        />
      ) : (
        <ul className="space-y-0.5">
          {tasks.map((t) => renderTask(t))}
        </ul>
      )}
    </div>
  );
}

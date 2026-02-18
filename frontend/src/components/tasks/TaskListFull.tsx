import { useEffect, useState } from 'react';
import { taskApi } from '../../api';
import { TaskItem } from '../TaskItem';
import { TaskForm } from './TaskForm';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { ChevronDown, ChevronRight, Plus, CheckSquare, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
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

  const handleAddClick = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSave = async (data: Partial<Task>) => {
    try {
      if (editingTask) await taskApi.updateTask(editingTask.id, data);
      else await taskApi.createTask(data);
      setShowForm(false);
      setEditingTask(null);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-fg-muted" />
      </div>
    );
  }

  const renderTask = (task: Task, depth = 0) => (
    <div key={task.id} className={cn(depth > 0 && 'ml-6 border-l border-border pl-3')}>
      <div className="flex items-center gap-1 py-0.5">
        {(task.subtasks?.length ?? 0) > 0 ? (
          <button
            type="button"
            onClick={() => toggleExpand(task.id)}
            className="p-0.5 text-fg-muted hover:text-foreground transition-fast"
          >
            {expanded.has(task.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="flex-1 min-w-0">
          <TaskItem 
            task={task} 
            onComplete={handleComplete} 
            onEdit={handleEditClick} 
          />
        </div>
      </div>
      {expanded.has(task.id) && task.subtasks?.length
        ? task.subtasks.map((st) => renderTask(st, depth + 1))
        : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
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
        <Button onClick={handleAddClick} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> 
          Add task
        </Button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-10 h-10" strokeWidth={1} />}
          title="No tasks found"
          description={filter === 'all' ? "Create your first task to get started." : "No tasks match the current filter."}
          action={
            <Button onClick={handleAddClick}>
              <Plus className="w-4 h-4 mr-1.5" /> 
              Add task
            </Button>
          }
        />
      ) : (
        <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-3">
          <ul className="space-y-0.5">
            {tasks.map((t) => renderTask(t))}
          </ul>
        </div>
      )}

      {/* Task Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <TaskForm
              initial={editingTask ?? undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

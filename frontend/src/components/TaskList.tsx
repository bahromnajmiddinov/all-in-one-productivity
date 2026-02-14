import { useEffect, useState, type FormEvent } from 'react';
import { taskApi } from '../api';
import { TaskItem } from './TaskItem';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Plus } from 'lucide-react';
import type { Task } from '../types';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await taskApi.getToday();
      setTasks(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTask.trim()) return;
    try {
      await taskApi.createTask({ title: newTask, status: 'active' });
      setNewTask('');
      loadTasks();
    } catch (error) {
      console.error('Failed to create task');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await taskApi.completeTask(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to complete task');
    }
  };

  if (loading) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-8">
        <p className="text-body text-fg-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg-elevated shadow-soft overflow-hidden">
      <form onSubmit={handleAddTask} className="flex gap-2 p-4 border-b border-border">
        <Input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="flex-1"
        />
        <Button type="submit" size="md">
          <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
          Add
        </Button>
      </form>

      <div className="p-2">
        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks for today"
            description="Add a task above or pick one from Projects."
          />
        ) : (
          <ul className="space-y-0.5">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskItem task={task} onComplete={handleComplete} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

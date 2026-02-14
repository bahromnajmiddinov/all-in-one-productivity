import { useEffect, useState, type FormEvent } from 'react';
import { taskApi } from '../api';
import { TaskItem } from './TaskItem';
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
    if (!newTask.trim()) {
      return;
    }
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          placeholder="Add a task..."
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks for today</p>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} onComplete={handleComplete} />
          ))
        )}
      </div>
    </div>
  );
}

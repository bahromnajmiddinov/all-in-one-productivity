import { TaskList } from '../components/TaskList';

export function Today() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Today</h2>
      <TaskList />
    </div>
  );
}

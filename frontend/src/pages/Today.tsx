import { TaskList } from '../components/TaskList';

export function Today() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Today</h2>
      <TaskList />
    </div>
  );
}

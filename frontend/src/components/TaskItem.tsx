import type { Task } from '../types';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskItem({ task, onComplete }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
      <input
        type="checkbox"
        checked={task.status === 'completed'}
        onChange={() => onComplete(task.id)}
        className="w-5 h-5"
      />
      <div className="flex-1">
        <span
          className={
            task.status === 'completed' ? 'line-through text-gray-400' : ''
          }
        >
          {task.title}
        </span>
        {task.project_info && (
          <span
            className="ml-2 text-xs px-2 py-1 rounded"
            style={{ background: task.project_info.color }}
          >
            {task.project_info.name}
          </span>
        )}
      </div>
      <span
        className={`text-xs px-2 py-1 rounded ${
          task.priority === 4
            ? 'bg-red-100 text-red-700'
            : task.priority === 3
              ? 'bg-orange-100 text-orange-700'
              : task.priority === 2
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700'
        }`}
      >
        P{task.priority}
      </span>
    </div>
  );
}

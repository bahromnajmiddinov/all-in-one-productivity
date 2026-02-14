import type { Task } from '../types';
import { cn } from '../lib/utils';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onEdit?: (task: Task) => void;
}

const priorityStyles: Record<number, string> = {
  1: 'bg-bg-subtle text-fg-muted border-border',
  2: 'bg-bg-subtle text-foreground border-border',
  3: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  4: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
};

export function TaskItem({ task, onComplete, onEdit }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-smooth',
        'hover:bg-bg-subtle/80'
      )}
    >
      <button
        type="button"
        onClick={() => onComplete(task.id)}
        className={cn(
          'size-5 shrink-0 rounded border border-border flex items-center justify-center transition-smooth',
          task.status === 'completed'
            ? 'bg-foreground border-foreground text-background'
            : 'hover:border-fg-muted'
        )}
        aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.status === 'completed' && (
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm',
            task.status === 'completed' ? 'line-through text-fg-muted' : 'text-foreground'
          )}
        >
          {task.title}
        </span>
        {task.project_info && (
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-md border"
            style={{ borderColor: task.project_info.color + '40', color: task.project_info.color }}
          >
            {task.project_info.name}
          </span>
        )}
      </div>
      <span
        className={cn(
          'shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md border',
          priorityStyles[task.priority] ?? priorityStyles[2]
        )}
      >
        P{task.priority}
      </span>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="shrink-0 text-fg-muted hover:text-foreground text-xs p-1"
        >
          Edit
        </button>
      )}
    </div>
  );
}

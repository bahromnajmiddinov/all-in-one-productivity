import { useEffect, useState } from 'react';
import { habitApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';
import { Target } from 'lucide-react';
import type { Habit } from '../../types/habits';
import { cn } from '../../lib/utils';

export function HabitList() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await habitApi.getToday();
      setHabits(Array.isArray(res.data) ? res.data : (res.data as any).results ?? []);
    } catch (e) {
      console.error('Failed to load habits', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await habitApi.toggle(id);
      load();
    } catch (e) {
      console.error('Failed to toggle habit', e);
    }
  };

  if (loading) return <p className="text-body text-fg-muted">Loading habits...</p>;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg-elevated shadow-soft overflow-hidden">
      {habits.length === 0 ? (
        <EmptyState
          icon={<Target className="size-10" strokeWidth={1} />}
          title="No habits due today"
          description="Add habits above; they’ll appear here when due."
        />
      ) : (
        <ul className="divide-y divide-border">
          {habits.map((habit) => (
            <li key={habit.id}>
              <div className="flex items-center gap-3 px-4 py-3 transition-smooth hover:bg-bg-subtle/50">
                <button
                  type="button"
                  onClick={() => handleToggle(habit.id)}
                  className={cn(
                    'size-9 shrink-0 rounded-full border-2 flex items-center justify-center transition-smooth',
                    habit.completed_today
                      ? 'bg-foreground border-foreground text-background'
                      : 'border-border hover:border-fg-muted'
                  )}
                  aria-label={habit.completed_today ? 'Mark incomplete' : 'Mark complete'}
                >
                  {habit.completed_today && (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    habit.completed_today ? 'text-fg-muted line-through' : 'text-foreground'
                  )}>
                    {habit.name}
                  </p>
                  <p className="text-caption mt-0.5">
                    Streak: {habit.current_streak} · Best: {habit.longest_streak} · {habit.completion_rate}% (30d)
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

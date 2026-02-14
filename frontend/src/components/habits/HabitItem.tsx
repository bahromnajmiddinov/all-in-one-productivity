import React from 'react';
import { Button } from '../../components/ui/Button';
import type { Habit } from '../../types/habits';
import { habitApi } from '../../api';

interface Props {
  habit: Habit;
  onToggled?: () => void;
}

export const HabitItem: React.FC<Props> = ({ habit, onToggled }) => {
  const handleToggle = async () => {
    try {
      await habitApi.toggle(habit.id);
      onToggled?.();
    } catch (e) {
      console.error('Failed to toggle habit', e);
    }
  };

  const handleComplete = async () => {
    try {
      await habitApi.complete(habit.id);
      onToggled?.();
    } catch (e) {
      console.error('Failed to complete habit', e);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-bg-elevated px-4 py-3 shadow-soft">
      <div>
        <p className="text-sm font-medium text-foreground">{habit.name}</p>
        <p className="text-caption mt-0.5">
          {habit.frequency === 'weekly'
            ? `Weekly (${(habit.target_weekdays || []).length} days)`
            : habit.frequency === 'custom'
            ? `Every ${habit.custom_interval_days ?? '?'} days`
            : 'Daily'}
          {' · '}Streak {habit.current_streak} · Best {habit.longest_streak}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleToggle}>
          Toggle
        </Button>
        <Button variant="secondary" size="sm" onClick={handleComplete}>
          Complete
        </Button>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { habitApi } from '../../api';
import { HabitCard } from './HabitCard';
import type { Habit } from '../../types/habit';

interface Props {
  refreshKey: number;
}

export function HabitList({ refreshKey }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, [refreshKey]);

  const loadHabits = async () => {
    try {
      const response = await habitApi.getHabits();
      setHabits(response.data);
    } catch (error) {
      console.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (habit: Habit) => {
    try {
      if (habit.completed_today) {
        await habitApi.uncompleteHabit(habit.id);
      } else {
        await habitApi.completeHabit(habit.id);
      }
      loadHabits();
    } catch (error) {
      console.error('Failed to toggle habit');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Habits</h3>
      {habits.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No habits yet. Create one!</p>
      ) : (
        habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={() => toggleComplete(habit)}
          />
        ))
      )}
    </div>
  );
}

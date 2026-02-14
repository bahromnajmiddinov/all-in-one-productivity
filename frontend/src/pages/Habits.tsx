import { useState, useCallback } from 'react';
import { HabitList, HabitForm } from '../components/habits';

export function Habits() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Habit Tracker</h2>
      <HabitForm onSuccess={refresh} />
      <HabitList refreshKey={refreshKey} />
    </div>
  );
}

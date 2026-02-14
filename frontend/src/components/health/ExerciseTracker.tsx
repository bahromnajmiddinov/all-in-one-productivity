import { useEffect, useState } from 'react';
import { healthApi } from '../../api';

interface ExerciseStats {
  total_workouts: number;
  total_duration: number;
  total_calories: number;
  current_streak: number;
  favorite_exercise: string | null;
}

export function ExerciseTracker() {
  const [stats, setStats] = useState<ExerciseStats>({
    total_workouts: 0,
    total_duration: 0,
    total_calories: 0,
    current_streak: 0,
    favorite_exercise: null,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await healthApi.getExerciseStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load exercise stats');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Exercise Tracker</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.total_workouts}</div>
          <div className="text-sm text-gray-500">Workouts (30 days)</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.total_duration}m</div>
          <div className="text-sm text-gray-500">Total Duration</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.total_calories}</div>
          <div className="text-sm text-gray-500">Calories Burned</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.current_streak}</div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </div>
      </div>

      {stats.favorite_exercise && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <span className="text-gray-500">Favorite: </span>
          <span className="font-medium">{stats.favorite_exercise}</span>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import type { ExerciseStats, WorkoutLog, PersonalRecord, FitnessGoal, RestDay } from '../../types/health';

export function ExerciseTracker() {
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [activeGoals, setActiveGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, workoutsRes, recordsRes, goalsRes] = await Promise.all([
        healthApi.getExerciseStats(),
        healthApi.getWorkoutLogs(),
        healthApi.getPersonalRecords(),
        healthApi.getActiveFitnessGoals(),
      ]);

      setStats(statsRes.data);
      setRecentWorkouts(workoutsRes.data.slice(0, 5));
      setPersonalRecords(recordsRes.data.filter((r: PersonalRecord) => r.is_active).slice(0, 5));
      setActiveGoals(goalsRes.data);
    } catch (error) {
      console.error('Failed to load exercise data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Exercise Tracker</h3>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold">{stats?.total_workouts || 0}</div>
          <div className="text-sm text-gray-500">Total Workouts</div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold">{stats?.current_streak || 0}</div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold">{stats?.total_volume_kg || 0}</div>
          <div className="text-sm text-gray-500">Total Volume (kg)</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold">{stats?.total_calories_burned || 0}</div>
          <div className="text-sm text-gray-500">Calories Burned</div>
        </div>
      </div>

      {/* Best Streak */}
      {stats && stats.best_streak > 0 && (
        <div className="mb-6 p-3 bg-yellow-50 rounded">
          <span className="text-gray-500">Best Streak: </span>
          <span className="font-medium">{stats.best_streak} days</span>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Goals</h4>
          <div className="space-y-2">
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">{goal.title}</span>
                  <span className="text-xs text-gray-500">{goal.status_label}</span>
                </div>
                {goal.progress_percentage !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Workouts</h4>
          <div className="space-y-2">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-sm">{workout.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{workout.date}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {workout.duration_minutes ? `${workout.duration_minutes} min` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Personal Records</h4>
          <div className="space-y-2">
            {personalRecords.map((record) => (
              <div key={record.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="font-medium text-sm">{record.exercise_name}</span>
                <span className="text-sm font-semibold text-green-700">
                  {record.weight_kg && `${record.weight_kg} kg`}
                  {record.reps && ` × ${record.reps}`}
                  {record.time_seconds && ` ${record.time_seconds}s`}
                  {record.volume_kg && ` ${record.volume_kg}kg vol`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Workout */}
      {stats?.last_workout_date && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <span className="text-gray-500">Last workout: </span>
          <span className="font-medium">{stats.last_workout_date}</span>
          {stats.last_workout_days_ago !== undefined && (
            <span className="text-sm text-gray-600 ml-2">
              ({stats.last_workout_days_ago} days ago)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

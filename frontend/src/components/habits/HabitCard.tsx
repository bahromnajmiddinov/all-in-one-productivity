import type { Habit } from '../../types/habit';

interface Props {
  habit: Habit;
  onToggle: () => void;
}

export function HabitCard({ habit, onToggle }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
      <button
        onClick={onToggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
          habit.completed_today
            ? 'text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        style={{ backgroundColor: habit.completed_today ? habit.color : undefined }}
      >
        ✓
      </button>

      <div className="flex-1">
        <h4 className="font-semibold">{habit.name}</h4>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            🔥 {habit.current_streak} day streak
          </span>
          <span>•</span>
          <span>{habit.completion_rate}% completion</span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-2xl font-bold" style={{ color: habit.color }}>
          {habit.current_streak}
        </div>
        <div className="text-xs text-gray-400">streak</div>
      </div>
    </div>
  );
}

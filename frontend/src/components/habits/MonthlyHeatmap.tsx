import { useState, useEffect } from 'react';
import { habitApi } from '../../api';

interface Props {
  habitId: string;
  color?: string;
}

export function MonthlyHeatmap({ habitId, color = '#10B981' }: Props) {
  const [completions, setCompletions] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadCompletions();
  }, [habitId, currentDate]);

  const loadCompletions = async () => {
    try {
      const response = await habitApi.getCompletions(
        habitId,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setCompletions(response.data.completions);
    } catch (error) {
      console.error('Failed to load completions');
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    return { daysInMonth, firstDayOfMonth };
  };

  const isCompleted = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    return completions.includes(dateStr);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Prev
        </button>
        <span className="font-semibold">{monthName}</span>
        <button
          onClick={goToNextMonth}
          className="text-gray-500 hover:text-gray-700"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs text-gray-400 py-1">{day}</div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const completed = isCompleted(day);
          return (
            <div
              key={day}
              className={`aspect-square rounded-md flex items-center justify-center text-sm ${
                completed ? 'text-white' : 'bg-gray-100 text-gray-400'
              }`}
              style={completed ? { backgroundColor: color } : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

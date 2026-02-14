import { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import type { WaterDailyStats } from '../../types/health';

export function WaterTracker() {
  const [stats, setStats] = useState<WaterDailyStats | null>(null);
  const [quickAmount, setQuickAmount] = useState(250);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await healthApi.getWaterToday();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load water stats');
    }
  };

  const addWater = async (amount: number) => {
    if (!amount) {
      return;
    }
    await healthApi.addWaterLog(amount);
    loadStats();
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  const percentage = stats.percentage;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Water Intake</h3>

      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg className="transform -rotate-90 w-full h-full">
          <circle cx="96" cy="96" r="90" stroke="#e5e7eb" strokeWidth="12" fill="none" />
          <circle
            cx="96"
            cy="96"
            r="90"
            stroke="#3B82F6"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference, strokeDashoffset }}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{stats.total_ml}ml</span>
          <span className="text-sm text-gray-500">/ {stats.goal_ml}ml</span>
          <span className="text-lg text-blue-600 font-semibold">{percentage}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[150, 250, 500].map((amount) => (
          <button
            key={amount}
            onClick={() => addWater(amount)}
            className="py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            +{amount}ml
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={quickAmount}
          onChange={(event) => setQuickAmount(Number(event.target.value))}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Custom amount"
          min={0}
        />
        <button
          onClick={() => addWater(quickAmount)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      {stats.remaining_ml > 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {stats.remaining_ml}ml more to reach your goal!
        </p>
      )}
    </div>
  );
}

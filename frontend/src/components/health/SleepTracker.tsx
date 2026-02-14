import { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import type { SleepLog } from '../../types/health';

interface SleepStats {
  avg_duration_hours: number;
  avg_quality: number;
  streak_days: number;
}

export function SleepTracker() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [stats, setStats] = useState<SleepStats>({
    avg_duration_hours: 0,
    avg_quality: 0,
    streak_days: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        healthApi.getSleepLogs(),
        healthApi.getSleepStats(),
      ]);
      setLogs(logsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to load sleep data');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Sleep Tracker</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.avg_duration_hours}h</div>
          <div className="text-sm text-gray-500">Avg Duration</div>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.avg_quality}/5</div>
          <div className="text-sm text-gray-500">Avg Quality</div>
        </div>
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-2xl font-bold">{stats.streak_days}</div>
          <div className="text-sm text-gray-500">Day Streak</div>
        </div>
      </div>

      <div className="space-y-2">
        {logs.slice(0, 5).map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{new Date(log.date).toLocaleDateString()}</div>
              <div className="text-sm text-gray-500">
                {log.duration_hours}h • Quality: {log.quality_label}
              </div>
            </div>
            <div className="text-2xl">
              {log.quality >= 4 ? '😴' : log.quality >= 3 ? '😊' : '😪'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

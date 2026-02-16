import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { habitApi } from '../../api';
import type { HabitTimeOfDayHabit, HabitTimeOfDayResponse } from '../../types/habits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

const formatMinutes = (minutes?: number | null) => {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, '0')} ${period}`;
};

const getPeakWindow = (counts: number[]) => {
  if (!counts.length) return '—';
  const maxCount = Math.max(...counts);
  if (maxCount === 0) return '—';
  const hour = counts.findIndex((count) => count === maxCount);
  if (hour === -1) return '—';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
};

export function HabitTimeOfDayInsights() {
  const [data, setData] = useState<HabitTimeOfDayHabit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    habitApi
      .getTimeOfDay(90)
      .then((res) => {
        if (!cancelled) {
          const payload = res.data as HabitTimeOfDayResponse;
          setData(payload.habits ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-fg-muted" />
          Time-of-day insights
        </CardTitle>
        <CardDescription>Understand when habits are most likely to be completed.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-caption text-fg-muted">Loading time-of-day analytics...</p>
        ) : data.length === 0 ? (
          <p className="text-caption text-fg-muted">No completion data yet.</p>
        ) : (
          <div className="space-y-3">
            {data.map((habit) => (
              <div key={habit.id} className="flex flex-col gap-1 rounded-lg border border-border/70 bg-bg-subtle/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{habit.name}</span>
                  <span className="text-caption text-fg-muted">{habit.total_completions} completions</span>
                </div>
                <div className="grid gap-2 text-caption text-fg-muted md:grid-cols-3">
                  <span>Best time: {formatMinutes(habit.best_time_minutes)}</span>
                  <span>Average time: {formatMinutes(habit.average_minutes)}</span>
                  <span>Peak hour: {getPeakWindow(habit.counts)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

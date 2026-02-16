import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { habitApi } from '../../api';
import type { HabitAnalyticsItem, HabitAnalyticsResponse } from '../../types/habits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

const trendConfig = {
  up: { icon: ArrowUpRight, className: 'text-emerald-500' },
  down: { icon: ArrowDownRight, className: 'text-rose-500' },
  flat: { icon: Minus, className: 'text-fg-muted' },
} as const;

const formatTrend = (item: HabitAnalyticsItem) => {
  if (item.trend_change == null || item.previous_completion_rate == null) return 'No trend yet';
  const change = Math.abs(item.trend_change).toFixed(1);
  return `${change}% vs last period`;
};

export function HabitAnalyticsDashboard() {
  const [data, setData] = useState<HabitAnalyticsResponse | null>(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    habitApi
      .getAnalytics(days)
      .then((res) => {
        if (!cancelled) setData(res.data as HabitAnalyticsResponse);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const habits = data?.habits ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Habit performance dashboard</CardTitle>
          <CardDescription>Compare habits side-by-side and review success rates.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption text-fg-muted">Window</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-caption text-fg-muted">Loading analytics...</p>
        ) : habits.length === 0 ? (
          <p className="text-caption text-fg-muted">No habits tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-caption text-fg-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">Habit</th>
                  <th className="py-2 pr-4 font-medium">Success rate</th>
                  <th className="py-2 pr-4 font-medium">Trend</th>
                  <th className="py-2 pr-4 font-medium">Strength</th>
                  <th className="py-2 pr-4 font-medium">Streaks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {habits.map((habit) => {
                  const trend = habit.trend_direction ?? 'flat';
                  const TrendIcon = trendConfig[trend].icon;
                  return (
                    <tr key={habit.id} className="text-sm">
                      <td className="py-3 pr-4 font-medium text-foreground">{habit.name}</td>
                      <td className="py-3 pr-4 text-fg-muted">{habit.completion_rate}%</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1">
                          <TrendIcon className={`size-4 ${trendConfig[trend].className}`} />
                          <span className="text-caption text-fg-muted">{formatTrend(habit)}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-full bg-bg-subtle px-2 py-1 text-xs font-medium">
                          {habit.strength_score}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-fg-muted">
                        Current {habit.current_streak} · Best {habit.longest_streak}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

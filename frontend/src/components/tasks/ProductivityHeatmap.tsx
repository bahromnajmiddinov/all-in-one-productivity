import { useEffect, useState } from 'react';
import { taskApi } from '../../api';
import { cn } from '../../lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ProductivityHeatmap({ days = 365 }: { days?: number }) {
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getHeatmap(days).then((res) => setCompletions(res.data.completions || {})).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  const maxCount = Math.max(1, ...Object.values(completions));
  const cells: { date: Date; count: number }[] = [];
  const d = new Date(start);
  while (d <= today) {
    const key = d.toISOString().split('T')[0];
    cells.push({ date: new Date(d), count: completions[key] || 0 });
    d.setDate(d.getDate() + 1);
  }

  // Group by week (Sun–Sat) for GitHub-style heatmap: each column = week, each row = weekday
  const weekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const byWeek = new Map<number, Map<number, number>>();
  cells.forEach(({ date, count }) => {
    const week = weekStart(date);
    const day = date.getDay() === 0 ? 7 : date.getDay();
    if (!byWeek.has(week)) byWeek.set(week, new Map());
    byWeek.get(week)!.set(day, (byWeek.get(week)!.get(day) || 0) + count);
  });
  const weeks = Array.from(byWeek.keys()).sort((a, b) => a - b).slice(-53);

  if (loading) return <p className="text-caption text-fg-muted">Loading heatmap...</p>;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 items-start">
        <div className="flex flex-col gap-0.5 pr-2 text-caption text-fg-muted shrink-0">
          {WEEKDAYS.map((_, i) => (
            <div key={i} className="h-3.5 flex items-center" style={{ height: '14px' }}>
              {i % 2 === 1 ? WEEKDAYS[i] : ''}
            </div>
          ))}
        </div>
        <div className="flex gap-0.5">
          {weeks.map((week) => (
            <div key={week} className="flex flex-col gap-0.5">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const count = byWeek.get(week)?.get(day) ?? 0;
                const intensity = maxCount ? count / maxCount : 0;
                return (
                  <div
                    key={day}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-smooth',
                      count === 0 && 'bg-bg-subtle',
                      count > 0 && intensity <= 0.25 && 'bg-foreground/25',
                      count > 0 && intensity > 0.25 && intensity <= 0.5 && 'bg-foreground/50',
                      count > 0 && intensity > 0.5 && intensity <= 0.75 && 'bg-foreground/70',
                      count > 0 && intensity > 0.75 && 'bg-foreground'
                    )}
                    title={`${count} task(s)`}
                    style={{ width: '12px', height: '12px' }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-caption text-fg-muted">
        <span>Less</span>
        <span>More</span>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pomodoroApi } from '../../api';
import { Timer } from 'lucide-react';

export function DashboardPomodoroWidget() {
  const [stats, setStats] = useState<{ today_count: number; today_minutes: number } | null>(null);

  useEffect(() => {
    pomodoroApi.getStats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  if (stats === null) return null;

  return (
    <Link
      to="/pomodoro"
      className="block rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-soft transition-smooth hover:shadow-soft-md hover:border-border/80"
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer className="size-4 text-fg-muted" strokeWidth={1.5} />
        <span className="text-caption uppercase tracking-wider text-fg-muted">Pomodoro today</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {stats.today_count} <span className="text-base font-normal text-fg-muted">sessions</span>
      </p>
      <p className="text-body mt-0.5">{stats.today_minutes} min focus</p>
    </Link>
  );
}

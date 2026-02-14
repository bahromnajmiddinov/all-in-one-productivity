import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { habitApi } from '../../api';
import type { HabitDashboard } from '../../types/habits';
import { Target } from 'lucide-react';

export function DashboardHabitsWidget() {
  const [data, setData] = useState<HabitDashboard | null>(null);

  useEffect(() => {
    habitApi.getDashboard().then((res) => setData(res.data)).catch(() => {});
  }, []);

  if (data === null) return null;

  const { total_due, completed_count } = data;

  return (
    <Link
      to="/habits"
      className="block rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-soft transition-smooth hover:shadow-soft-md hover:border-border/80"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className="size-4 text-fg-muted" strokeWidth={1.5} />
        <span className="text-caption uppercase tracking-wider text-fg-muted">Habits today</span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {completed_count} <span className="text-base font-normal text-fg-muted">/ {total_due}</span>
      </p>
      <p className="text-body mt-0.5">
        {total_due === 0 ? 'No habits due' : 'completed'}
      </p>
    </Link>
  );
}

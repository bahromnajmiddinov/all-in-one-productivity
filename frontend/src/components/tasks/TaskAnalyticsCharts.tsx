import { useEffect, useState } from 'react';
import { taskApi } from '../../api';
import { ProductivityHeatmap } from './ProductivityHeatmap';
import type { TaskAnalytics, TaskDistribution } from '../../types';

export function TaskAnalyticsCharts() {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [distribution, setDistribution] = useState<TaskDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    Promise.all([
      taskApi.getAnalytics(days),
      taskApi.getDistribution(),
    ]).then(([a, d]) => {
      setAnalytics(a.data);
      setDistribution(d.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <p className="text-body text-fg-muted">Loading analytics...</p>;

  return (
    <div className="space-y-8">
      <div className="flex gap-4 items-center">
        <label className="text-sm text-foreground">Period:</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <p className="text-caption text-fg-muted">Completion rate</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{analytics.completion_rate}%</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <p className="text-caption text-fg-muted">Completed</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{analytics.completed_count} / {analytics.total_tasks}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <p className="text-caption text-fg-muted">Overdue</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{analytics.overdue_count}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <p className="text-caption text-fg-muted">Est. accuracy</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {analytics.estimation_accuracy != null ? `${analytics.estimation_accuracy}%` : '—'}
            </p>
          </div>
        </div>
      )}

      {distribution && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <h4 className="text-h3 mb-3">By project</h4>
            <ul className="space-y-2">
              {distribution.by_project.slice(0, 8).map((p) => (
                <li key={p.name} className="flex justify-between text-sm">
                  <span className="text-foreground truncate mr-2">{p.name}</span>
                  <span className="text-fg-muted shrink-0">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <h4 className="text-h3 mb-3">By priority</h4>
            <ul className="space-y-2">
              {distribution.by_priority.map((p) => (
                <li key={p.priority} className="flex justify-between text-sm">
                  <span className="text-foreground">P{p.priority}</span>
                  <span className="text-fg-muted">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
            <h4 className="text-h3 mb-3">By status</h4>
            <ul className="space-y-2">
              {distribution.by_status.map((s) => (
                <li key={s.status} className="flex justify-between text-sm">
                  <span className="text-foreground capitalize">{s.status}</span>
                  <span className="text-fg-muted">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4">
        <h4 className="text-h3 mb-4">Productivity heatmap (task completions)</h4>
        <ProductivityHeatmap days={days === 7 ? 30 : days === 30 ? 90 : 365} />
      </div>
    </div>
  );
}

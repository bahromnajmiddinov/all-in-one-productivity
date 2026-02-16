import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { habitApi } from '../../api';
import type { HabitChainRun, HabitChainsResponse } from '../../types/habits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

const getLongestRun = (runs: HabitChainRun[]) => {
  if (!runs.length) return 0;
  return Math.max(...runs.map((run) => run.length));
};

const getLatestRun = (runs: HabitChainRun[]) => {
  if (!runs.length) return null;
  return runs[runs.length - 1];
};

export function HabitChains() {
  const [habits, setHabits] = useState<HabitChainsResponse['habits']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    habitApi
      .getChains(365)
      .then((res) => {
        if (!cancelled) setHabits((res.data as HabitChainsResponse).habits ?? []);
      })
      .catch(() => {
        if (!cancelled) setHabits([]);
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
          <Link2 className="size-4 text-fg-muted" />
          Habit chains
        </CardTitle>
        <CardDescription>Visualize consecutive completion runs over the last year.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-caption text-fg-muted">Loading chain data...</p>
        ) : habits.length === 0 ? (
          <p className="text-caption text-fg-muted">No chain data yet.</p>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const longest = getLongestRun(habit.runs);
              const latest = getLatestRun(habit.runs);
              return (
                <div key={habit.id} className="rounded-lg border border-border/70 bg-bg-subtle/40 px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{habit.name}</p>
                      <p className="text-caption text-fg-muted">Longest chain: {longest} days</p>
                    </div>
                    <div className="text-caption text-fg-muted">
                      {latest ? `Latest chain ${latest.start} → ${latest.end} (${latest.length} days)` : 'No chains yet'}
                    </div>
                  </div>
                  {habit.runs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {habit.runs.slice(-6).map((run, index) => (
                        <span
                          key={`${run.start}-${index}`}
                          className="rounded-full border border-border/70 px-2 py-1 text-xs text-fg-muted"
                        >
                          {run.length}d · {run.start}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

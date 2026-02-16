import { useEffect, useState } from 'react';
import { Grid } from 'lucide-react';
import { habitApi } from '../../api';
import type { HabitCorrelationResponse } from '../../types/habits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

const getCellColor = (value: number) => {
  if (value > 0.5) return 'bg-emerald-500/15 text-emerald-500';
  if (value > 0.2) return 'bg-emerald-500/10 text-emerald-500';
  if (value < -0.5) return 'bg-rose-500/15 text-rose-500';
  if (value < -0.2) return 'bg-rose-500/10 text-rose-500';
  return 'bg-bg-subtle text-fg-muted';
};

export function HabitCorrelationMatrix() {
  const [data, setData] = useState<HabitCorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    habitApi
      .getCorrelations(90)
      .then((res) => {
        if (!cancelled) setData(res.data as HabitCorrelationResponse);
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
  }, []);

  const habits = data?.habits ?? [];
  const matrix = data?.matrix ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="size-4 text-fg-muted" />
          Habit correlation matrix
        </CardTitle>
        <CardDescription>See how habit completions move together over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-caption text-fg-muted">Loading correlations...</p>
        ) : habits.length === 0 ? (
          <p className="text-caption text-fg-muted">No habits available for correlation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-fg-muted">Habit</th>
                  {habits.map((habit) => (
                    <th key={habit.id} className="p-2 text-left text-fg-muted">
                      {habit.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.map((rowHabit, rowIndex) => (
                  <tr key={rowHabit.id}>
                    <td className="p-2 text-fg-muted font-medium">{rowHabit.name}</td>
                    {matrix[rowIndex]?.map((value, colIndex) => (
                      <td key={`${rowHabit.id}-${colIndex}`} className="p-2">
                        <span
                          className={`inline-flex w-12 justify-center rounded-md px-2 py-1 font-medium ${getCellColor(value)}`}
                        >
                          {value.toFixed(2)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

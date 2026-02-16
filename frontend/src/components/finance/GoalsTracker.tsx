import { useEffect, useState } from 'react';
import { financeApi } from '../../api';

interface Goal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date?: string | null;
}

export function GoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await financeApi.getGoals();
        setGoals(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-3">
      {goals.length === 0 ? (
        <div className="text-sm text-muted-foreground">No financial goals yet.</div>
      ) : (
        goals.map((goal) => {
          const target = Number(goal.target_amount);
          const current = Number(goal.current_amount);
          const percent = target ? (current / target) * 100 : 0;
          return (
            <div key={goal.id} className="p-3 rounded border bg-bg-elevated">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium">{goal.name}</div>
                  <div className="text-xs text-muted-foreground">Target {target.toFixed(2)}</div>
                </div>
                <div className="text-sm">{current.toFixed(2)}</div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {percent.toFixed(1)}% saved{goal.target_date ? ` · target ${goal.target_date}` : ''}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

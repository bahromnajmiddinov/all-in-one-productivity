import { useEffect, useState } from 'react';
import { financeApi } from '../../api';

interface BudgetActual {
  id: string;
  name: string;
  category: string;
  amount: number;
  actual: number;
  start_date: string;
  end_date: string;
  percent_used: number;
  variance: number;
  alert: boolean;
}

export function BudgetVsActual() {
  const [budgets, setBudgets] = useState<BudgetActual[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await financeApi.getBudgetVsActual();
        setBudgets(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-3">
      {budgets.length === 0 ? (
        <div className="text-sm text-muted-foreground">No budgets tracked yet.</div>
      ) : (
        budgets.map((budget) => (
          <div key={budget.id} className="p-3 rounded border bg-bg-elevated">
            <div className="flex justify-between">
              <div>
                <div className="text-sm font-medium">{budget.name}</div>
                <div className="text-xs text-muted-foreground">{budget.category}</div>
              </div>
              <div className={`text-sm ${budget.alert ? 'text-red-500' : ''}`}>
                {budget.actual.toFixed(2)} / {budget.amount.toFixed(2)}
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${budget.alert ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {budget.percent_used.toFixed(1)}% used · {budget.variance.toFixed(2)} remaining
            </div>
          </div>
        ))
      )}
    </div>
  );
}

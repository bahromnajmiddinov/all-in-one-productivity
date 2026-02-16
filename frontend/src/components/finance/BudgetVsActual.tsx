import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, Wallet } from 'lucide-react';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await financeApi.getBudgetVsActual();
        setBudgets(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getProgressColor = (percent: number, alert: boolean) => {
    if (alert) return 'bg-red-500';
    if (percent >= 90) return 'bg-yellow-500';
    if (percent >= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (percent: number, alert: boolean) => {
    if (alert) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (percent >= 90) return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-bg-subtle rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-8 h-8" />}
        title="No budgets yet"
        description="Create a budget to track your spending limits."
      />
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map((budget) => {
        const progressColor = getProgressColor(budget.percent_used, budget.alert);
        const statusIcon = getStatusIcon(budget.percent_used, budget.alert);
        const isOverBudget = budget.actual > budget.amount;

        return (
          <Card key={budget.id} className={`overflow-hidden ${budget.alert ? 'border-red-500/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{budget.name}</span>
                    {statusIcon}
                  </div>
                  <span className="text-xs text-fg-muted">{budget.category}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : ''}`}>
                    {formatCurrency(budget.actual)}
                  </div>
                  <div className="text-xs text-fg-muted">
                    of {formatCurrency(budget.amount)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(budget.percent_used, 100)}%` }}
                  />
                </div>
                
                {/* Percentage Labels */}
                <div className="flex justify-between mt-1.5 text-xs">
                  <span className={`font-medium ${budget.alert ? 'text-red-600' : 'text-fg-muted'}`}>
                    {budget.percent_used.toFixed(0)}% used
                  </span>
                  <span className={`font-medium ${budget.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {budget.variance < 0 ? '-' : ''}{formatCurrency(Math.abs(budget.variance))} {budget.variance < 0 ? 'over' : 'remaining'}
                  </span>
                </div>
              </div>

              {/* Date Range */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-fg-muted">
                <span>
                  {new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {''}
                  {new Date(budget.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {budget.alert && (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Over budget
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

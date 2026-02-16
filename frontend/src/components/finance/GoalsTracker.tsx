import { useEffect, useState } from 'react';
import { Target, Calendar, TrendingUp, PiggyBank, Flag } from 'lucide-react';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

interface Goal {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date?: string | null;
}

export function GoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await financeApi.getGoals();
        setGoals(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? Number(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const calculateDaysLeft = (targetDate?: string | null) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-bg-subtle rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<Target className="w-8 h-8" />}
        title="No financial goals yet"
        description="Set goals to track your savings targets and stay motivated."
      />
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const target = Number(goal.target_amount);
        const current = Number(goal.current_amount);
        const percent = target ? Math.min((current / target) * 100, 100) : 0;
        const daysLeft = calculateDaysLeft(goal.target_date);

        let progressColor = 'bg-blue-500';
        if (percent >= 100) progressColor = 'bg-green-500';
        else if (percent >= 75) progressColor = 'bg-emerald-500';
        else if (percent >= 50) progressColor = 'bg-blue-500';
        else if (percent >= 25) progressColor = 'bg-yellow-500';
        else progressColor = 'bg-orange-500';

        return (
          <Card key={goal.id} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${percent >= 100 ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                    {percent >= 100 ? (
                      <Flag className="w-5 h-5 text-green-600" />
                    ) : (
                      <PiggyBank className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{goal.name}</h3>
                    {goal.target_date && (
                      <div className="flex items-center gap-1 text-xs text-fg-muted mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Target: {new Date(goal.target_date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                          {daysLeft !== null && daysLeft > 0 && (
                            <span className="ml-1">({daysLeft} days left)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{formatCurrency(current)}</div>
                  <div className="text-xs text-fg-muted">of {formatCurrency(target)}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="h-3 bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressColor} transition-all duration-700 ease-out`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                {/* Milestones */}
                <div className="flex justify-between mt-2 text-xs text-fg-muted">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{percent.toFixed(0)}% complete</span>
                  </div>
                  <div>
                    {percent >= 100 ? (
                      <span className="text-green-600 font-medium">Goal achieved! 🎉</span>
                    ) : (
                      <span>{formatCurrency(target - current)} to go</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

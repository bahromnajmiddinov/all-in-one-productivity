import { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Scale, Activity } from 'lucide-react';
import { financeApi } from '../../api';
import { Card, CardContent } from '../ui/Card';

interface NetWorthHistory {
  date: string;
  net_worth: string;
}

interface NetWorthSummary {
  assets: number;
  liabilities: number;
  net_worth: number;
  history: NetWorthHistory[];
}

interface HealthScore {
  overall_score: number;
  savings_score: number;
  budget_score: number;
  debt_score: number;
  savings_rate: number;
  income_total: number;
  expense_total: number;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

function StatCard({ title, value, subtitle, icon, trend, trendValue, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-bg-elevated',
    success: 'bg-green-500/5 border-green-500/20',
    danger: 'bg-red-500/5 border-red-500/20',
    warning: 'bg-yellow-500/5 border-yellow-500/20',
  };

  const iconStyles = {
    default: 'text-fg-muted',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
  };

  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-fg-muted">{title}</p>
            <p className="text-2xl font-semibold mt-1 truncate">{value}</p>
            {subtitle && <p className="text-xs text-fg-muted mt-1">{subtitle}</p>}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-fg-muted'
              }`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                 trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-bg-subtle ${iconStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceOverview() {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [netRes, healthRes] = await Promise.all([
          financeApi.getNetWorthSummary({ snapshot: 'true' }),
          financeApi.getHealthScore(),
        ]);
        setNetWorth(netRes.data);
        setHealth(healthRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const historyData = netWorth?.history?.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Number(entry.net_worth),
  })) || [];

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const netWorthChange = historyData.length > 1 
    ? ((historyData[historyData.length - 1].value - historyData[0].value) / Math.abs(historyData[0].value || 1)) * 100
    : 0;

  return (
    <section className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(netWorth?.net_worth)}
          subtitle="Total assets minus liabilities"
          icon={<Wallet className="w-5 h-5" />}
          trend={netWorthChange >= 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(netWorthChange).toFixed(1)}%`}
          variant={netWorthChange >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Total Assets"
          value={formatCurrency(netWorth?.assets)}
          subtitle="Cash, investments, property"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="Liabilities"
          value={formatCurrency(netWorth?.liabilities)}
          subtitle="Debts and obligations"
          icon={<TrendingDown className="w-5 h-5" />}
          variant="danger"
        />
        <StatCard
          title="Financial Health"
          value={`${health?.overall_score ?? '—'}%`}
          subtitle={`Savings rate ${health?.savings_rate ?? '—'}%`}
          icon={<Activity className="w-5 h-5" />}
          variant={health ? (health.overall_score >= 70 ? 'success' : health.overall_score >= 50 ? 'warning' : 'danger') : 'default'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Net Worth Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium">Net Worth Trend</h3>
                <p className="text-xs text-fg-muted">Your financial growth over time</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <Scale className="w-4 h-4" />
                <span>Last 30 days</span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--fg-muted))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--fg-muted))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--bg-elevated))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Net Worth']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorNetWorth)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Score Breakdown */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium mb-1">Score Breakdown</h3>
            <p className="text-xs text-fg-muted mb-4">Financial health components</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Savings</span>
                  <span className="text-xs text-fg-muted">{health?.savings_score ?? '—'}%</span>
                </div>
                <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${health?.savings_score ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Budget Discipline</span>
                  <span className="text-xs text-fg-muted">{health?.budget_score ?? '—'}%</span>
                </div>
                <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${health?.budget_score ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Debt Load</span>
                  <span className="text-xs text-fg-muted">{health?.debt_score ?? '—'}%</span>
                </div>
                <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                    style={{ width: `${health?.debt_score ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-fg-muted">Monthly Income</span>
                <span className="font-medium text-green-600">+{formatCurrency(health?.income_total)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-fg-muted">Monthly Expenses</span>
                <span className="font-medium text-red-600">-{formatCurrency(health?.expense_total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

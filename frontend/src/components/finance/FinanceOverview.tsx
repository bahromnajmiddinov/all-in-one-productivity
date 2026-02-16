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
import { TrendingUp, TrendingDown, Wallet, Scale, Activity, TrendingUp as GrowthIcon } from 'lucide-react';
import { financeApi } from '../../api';
import { Card, CardContent } from '../ui/Card';
import { CircularProgress } from '../ui/CircularProgress';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

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
  isLoading?: boolean;
}

function StatCard({ title, value, subtitle, icon, trend, trendValue, variant = 'default', isLoading }: StatCardProps) {
  const variantStyles = {
    default: 'border-border/60',
    success: 'border-green-500/20 bg-green-500/[0.03]',
    danger: 'border-red-500/20 bg-red-500/[0.03]',
    warning: 'border-yellow-500/20 bg-yellow-500/[0.03]',
  };

  const iconBgStyles = {
    default: 'bg-bg-subtle text-fg-muted',
    success: 'bg-green-500/10 text-green-500',
    danger: 'bg-red-500/10 text-red-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
  };

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton variant="circular" className="w-12 h-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${variantStyles[variant]} border hover:shadow-soft-md transition-all duration-200 hover:-translate-y-0.5`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-fg-muted">{title}</p>
            <p className="text-2xl font-bold mt-1 truncate text-foreground tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-fg-subtle mt-1.5">{subtitle}</p>}
            {trend && trendValue && (
              <div className={`flex items-center gap-1.5 mt-2.5 text-xs font-medium ${
                trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-fg-muted'
              }`}>
                {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : 
                 trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                <span>{trendValue}</span>
                <span className="text-fg-subtle">vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${iconBgStyles[variant]}`}>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [netRes, healthRes] = await Promise.all([
          financeApi.getNetWorthSummary({ snapshot: 'true' }),
          financeApi.getHealthScore(),
        ]);
        setNetWorth(netRes.data);
        setHealth(healthRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const netWorthChange = historyData.length > 1 
    ? ((historyData[historyData.length - 1].value - historyData[0].value) / Math.abs(historyData[0].value || 1)) * 100
    : 0;

  const getHealthVariant = (score?: number) => {
    if (!score) return 'default';
    return score >= 70 ? 'success' : score >= 50 ? 'warning' : 'danger';
  };

  return (
    <section className="space-y-6">
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
          isLoading={loading}
        />
        <StatCard
          title="Total Assets"
          value={formatCurrency(netWorth?.assets)}
          subtitle="Cash, investments, property"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
          isLoading={loading}
        />
        <StatCard
          title="Liabilities"
          value={formatCurrency(netWorth?.liabilities)}
          subtitle="Debts and obligations"
          icon={<TrendingDown className="w-5 h-5" />}
          variant="danger"
          isLoading={loading}
        />
        <StatCard
          title="Financial Health"
          value={`${health?.overall_score ?? '—'}`}
          subtitle={`Savings rate ${health?.savings_rate ?? '—'}%`}
          icon={<Activity className="w-5 h-5" />}
          variant={getHealthVariant(health?.overall_score)}
          isLoading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Chart */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Net Worth Trend</h3>
                <p className="text-sm text-fg-muted mt-1">Your financial growth over time</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-subtle">
                <Scale className="w-4 h-4 text-fg-muted" />
                <span className="text-sm font-medium text-fg-muted">Last 30 days</span>
              </div>
            </div>
            
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : historyData.length === 0 ? (
              <EmptyState
                icon={<GrowthIcon className="w-8 h-8" />}
                title="No data yet"
                description="Start tracking your finances to see your net worth trends over time."
                action={<Button size="sm">Add Your First Transaction</Button>}
                className="h-48"
              />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
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
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--bg-elevated))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.2)',
                      }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Net Worth']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorNetWorth)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Health Score Breakdown */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Health Score</h3>
                <p className="text-sm text-fg-muted mt-1">Financial health components</p>
              </div>
              {health && (
                <CircularProgress 
                  value={health.overall_score} 
                  size="md" 
                  variant={getHealthVariant(health.overall_score)}
                />
              )}
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-fg-muted">Savings Rate</span>
                    <span className="text-sm font-semibold text-foreground">{health?.savings_score ?? '—'}%</span>
                  </div>
                  <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${health?.savings_score ?? 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-fg-muted">Budget Discipline</span>
                    <span className="text-sm font-semibold text-foreground">{health?.budget_score ?? '—'}%</span>
                  </div>
                  <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${health?.budget_score ?? 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-fg-muted">Debt Load</span>
                    <span className="text-sm font-semibold text-foreground">{health?.debt_score ?? '—'}%</span>
                  </div>
                  <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                      style={{ width: `${health?.debt_score ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {!loading && health && (
              <div className="mt-6 pt-5 border-t border-border/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-fg-muted">Monthly Income</span>
                  <span className="text-sm font-semibold text-green-500">+{formatCurrency(health.income_total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-fg-muted">Monthly Expenses</span>
                  <span className="text-sm font-semibold text-red-500">-{formatCurrency(health.expense_total)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

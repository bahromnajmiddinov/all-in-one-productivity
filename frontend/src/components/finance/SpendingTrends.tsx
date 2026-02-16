import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, PieChartIcon, BarChart3 } from 'lucide-react';
import { financeApi } from '../../api';
import { Card, CardContent } from '../ui/Card';

type DailyPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
};

type CategoryPoint = {
  category: string;
  total: number;
};

type AccountPoint = {
  account: string;
  total: number;
};

interface SpendingTrendsProps {
  compact?: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function SpendingTrends({ compact }: SpendingTrendsProps) {
  const [lineData, setLineData] = useState<DailyPoint[]>([]);
  const [pieData, setPieData] = useState<CategoryPoint[]>([]);
  const [barData, setBarData] = useState<AccountPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getSpendingTrends({ days: compact ? 30 : 90 });
      setLineData(res.data.daily || []);
      setPieData(res.data.by_category || []);
      setBarData(res.data.by_account || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className={`grid gap-4 ${compact ? '' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {[...Array(compact ? 1 : 3)].map((_, i) => (
          <Card key={i} className={compact ? '' : i === 2 ? 'lg:col-span-2' : ''}>
            <CardContent className="p-5">
              <div className="h-48 animate-pulse bg-bg-subtle rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Compact mode - just show the line chart
  if (compact) {
    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={lineData}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--fg-muted))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              stroke="hsl(var(--fg-muted))"
              fontSize={10}
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
              formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#10B981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorIncome)" 
            />
            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="#EF4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorExpense)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Income vs Expense Over Time */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-fg-muted" />
            <h3 className="text-sm font-medium">Spending Over Time</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--fg-muted))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis 
                  stroke="hsl(var(--fg-muted))"
                  fontSize={10}
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
                  formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Spending by Account */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-fg-muted" />
            <h3 className="text-sm font-medium">Spend by Account</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--fg-muted))" fontSize={10} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="account" type="category" width={100} stroke="hsl(var(--fg-muted))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--bg-elevated))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="lg:col-span-2">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-fg-muted" />
            <h3 className="text-sm font-medium">Category Breakdown</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="total" 
                  nameKey="category" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={2}
                  label={(props) => {
                    const { name, percent } = props as { name: string; percent: number };
                    return `${name} ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--bg-elevated))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

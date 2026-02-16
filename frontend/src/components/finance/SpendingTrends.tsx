import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';
import { TrendingUp } from 'lucide-react';

type Transaction = {
  id: string;
  date: string;
  amount: string;
  type: 'expense' | 'income' | 'transfer';
  category?: { name: string } | null;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function SpendingTrends() {
  const [lineData, setLineData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getTransactions({ page_size: 100 });
      const txs: Transaction[] = res.data.results || res.data;

      // aggregate by date for line chart
      const dateMap: Record<string, number> = {};
      const catMap: Record<string, number> = {};

      txs.forEach((t) => {
        const dateKey = new Date(t.date).toISOString().split('T')[0];
        const amount = parseFloat(t.amount);
        dateMap[dateKey] = (dateMap[dateKey] || 0) + amount;

        const catName = t.category?.name || t.type;
        catMap[catName] = (catMap[catName] || 0) + amount;
      });

      setLineData(
        Object.keys(dateMap)
          .sort()
          .map((d) => ({ date: d, amount: dateMap[d] }))
      );

      setPieData(
        Object.keys(catMap).map((cat) => ({
          name: cat,
          value: Math.round(catMap[cat]),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Loading spending trends...
      </div>
    );
  }

  if (lineData.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-8 h-8" />}
        title="No spending data yet"
        description="Add transactions to see your spending trends"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 rounded border bg-bg-elevated">
        <h3 className="text-md font-medium mb-4">Daily Spending</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={lineData}>
            <XAxis
              dataKey="date"
              stroke="hsl(var(--fg-muted))"
              fontSize={10}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="hsl(var(--fg-muted))" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--bg-elevated))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value) => `$${Number(value).toFixed(2)}`}
            />
            <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded border bg-bg-elevated">
        <h3 className="text-md font-medium mb-4">By Category</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
              {pieData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


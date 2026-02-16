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
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { financeApi } from '../../api';

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

export function SpendingTrends() {
  const [lineData, setLineData] = useState<DailyPoint[]>([]);
  const [pieData, setPieData] = useState<CategoryPoint[]>([]);
  const [barData, setBarData] = useState<AccountPoint[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await financeApi.getSpendingTrends({ days: 90 });
      setLineData(res.data.daily || []);
      setPieData(res.data.by_category || []);
      setBarData(res.data.by_account || []);
    } catch (err) {
      console.error(err);
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#7fc8ff'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 rounded border bg-bg-elevated">
        <h3 className="text-md font-medium mb-2">Spending Over Time</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded border bg-bg-elevated">
        <h3 className="text-md font-medium mb-2">Spend by Account</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="account" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="total" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded border bg-bg-elevated lg:col-span-2">
        <h3 className="text-md font-medium mb-2">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} dataKey="total" nameKey="category" outerRadius={80} label>
              {pieData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

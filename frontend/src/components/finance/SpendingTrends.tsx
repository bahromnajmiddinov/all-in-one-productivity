import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { financeApi } from '../../api';

export function SpendingTrends() {
  const [lineData, setLineData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await financeApi.getTransactions({ page_size: 100 });
      const txs = res.data.results || res.data;

      // simple line: sum by date
      const sums: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      txs.forEach((t: any) => {
        const d = new Date(t.date).toISOString().slice(0,10);
        sums[d] = (sums[d] || 0) + parseFloat(t.amount);
        const cat = t.category?.name || t.type;
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(t.amount);
      });

      setLineData(Object.keys(sums).sort().map((d) => ({ date: d, amount: sums[d] })));
      setPieData(Object.keys(byCategory).map((k) => ({ name: k, value: byCategory[k] })));
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
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 rounded border bg-bg-elevated">
        <h3 className="text-md font-medium mb-2">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
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

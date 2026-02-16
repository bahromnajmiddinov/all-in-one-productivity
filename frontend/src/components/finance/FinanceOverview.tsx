import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { financeApi } from '../../api';

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

export function FinanceOverview() {
  const [netWorth, setNetWorth] = useState<NetWorthSummary | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [netRes, healthRes] = await Promise.all([
          financeApi.getNetWorthSummary({ snapshot: true }),
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
    date: entry.date,
    value: Number(entry.net_worth),
  })) || [];

  const formatNumber = (value?: number) =>
    value !== undefined && value !== null ? value.toFixed(2) : '—';

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Net Worth</div>
          <div className="text-2xl font-semibold">{formatNumber(netWorth?.net_worth)}</div>
        </div>
        <div className="p-4 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Assets</div>
          <div className="text-2xl font-semibold">{formatNumber(netWorth?.assets)}</div>
        </div>
        <div className="p-4 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Liabilities</div>
          <div className="text-2xl font-semibold">{formatNumber(netWorth?.liabilities)}</div>
        </div>
        <div className="p-4 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Financial Health</div>
          <div className="text-2xl font-semibold">{health?.overall_score ?? '—'}%</div>
          <div className="text-xs text-muted-foreground mt-1">Savings rate {health?.savings_rate ?? '—'}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 rounded border bg-bg-elevated">
          <div className="text-sm font-medium mb-2">Net Worth Trend</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-4 rounded border bg-bg-elevated">
          <div className="text-sm font-medium mb-2">Score Breakdown</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Savings</span>
                <span>{health?.savings_score ?? '—'}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${health?.savings_score ?? 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Budget Discipline</span>
                <span>{health?.budget_score ?? '—'}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${health?.budget_score ?? 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Debt Load</span>
                <span>{health?.debt_score ?? '—'}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${health?.debt_score ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { financeApi } from '../../api';

interface ComparisonRow {
  category: string;
  current_total: number;
  previous_total: number;
  change: number;
  percent_change: number | null;
}

interface ComparisonData {
  current_month: string;
  previous_month: string;
  comparison: ComparisonRow[];
}

export function MonthOverMonthComparison() {
  const [data, setData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await financeApi.getMonthComparison();
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  if (!data) {
    return <div className="text-sm text-muted-foreground">Loading comparison...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Comparing {data.previous_month} to {data.current_month}
      </div>
      <div className="space-y-2">
        {data.comparison.length === 0 ? (
          <div className="text-sm text-muted-foreground">No spending data yet.</div>
        ) : (
          data.comparison.map((row) => (
            <div key={row.category} className="p-3 rounded border bg-bg-elevated">
              <div className="flex justify-between">
                <div className="text-sm font-medium">{row.category}</div>
                <div className={`text-sm ${row.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {row.previous_total.toFixed(2)} → {row.current_total.toFixed(2)}
                {row.percent_change !== null && ` · ${row.percent_change}%`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

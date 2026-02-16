import { useEffect, useState } from 'react';
import { Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await financeApi.getMonthComparison();
        setData(res.data);
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
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-bg-subtle rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.comparison.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        title="No comparison data"
        description="Add transactions to see month-over-month comparisons."
      />
    );
  }

  const totalChange = data.comparison.reduce((sum, row) => sum + row.change, 0);
  const totalCurrent = data.comparison.reduce((sum, row) => sum + row.current_total, 0);
  const totalPrevious = data.comparison.reduce((sum, row) => sum + row.previous_total, 0);
  const totalPercentChange = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-fg-muted" />
          <span className="text-fg-muted">
            {data.previous_month} → {data.current_month}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${totalChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {totalChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {totalPercentChange > 0 ? '+' : ''}{totalPercentChange.toFixed(1)}% total
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-bg-subtle/50">
          <CardContent className="p-3">
            <div className="text-xs text-fg-muted">Previous</div>
            <div className="font-semibold">{formatCurrency(totalPrevious)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-fg-muted">Current</div>
            <div className="font-semibold">{formatCurrency(totalCurrent)}</div>
          </CardContent>
        </Card>
        <Card className={totalChange > 0 ? 'bg-red-500/5' : 'bg-green-500/5'}>
          <CardContent className="p-3">
            <div className="text-xs text-fg-muted">Change</div>
            <div className={`font-semibold ${totalChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalChange > 0 ? '+' : ''}{formatCurrency(totalChange)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        {data.comparison.map((row) => {
          const isIncrease = row.change > 0;
          const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Card key={row.category} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${isIncrease ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                      <Icon className={`w-3.5 h-3.5 ${isIncrease ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <span className="font-medium text-sm">{row.category}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                      {isIncrease ? '+' : ''}{formatCurrency(row.change)}
                    </div>
                    {row.percent_change !== null && (
                      <div className="text-xs text-fg-muted">
                        {row.percent_change > 0 ? '+' : ''}{row.percent_change}%
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
                  <span>{formatCurrency(row.previous_total)}</span>
                  <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isIncrease ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(Math.abs(row.percent_change || 0), 100)}%` }}
                    />
                  </div>
                  <span>{formatCurrency(row.current_total)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

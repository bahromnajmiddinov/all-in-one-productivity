import { useEffect, useState } from 'react';
import { Repeat, Play, Trash2, Calendar, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { financeApi } from '../../api';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

interface RecurringTransaction {
  id: string;
  amount: string;
  currency: string;
  type: 'expense' | 'income';
  frequency: string;
  next_run?: string | null;
  account?: { name: string } | string;
  category?: { name: string } | string | null;
}

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export function RecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getRecurring();
      setRecurring(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runNow = async () => {
    try {
      await financeApi.runRecurringNow();
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return;
    try {
      await financeApi.deleteRecurring(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const getName = (value?: { name: string } | string | null) => {
    if (!value) return '—';
    if (typeof value === 'string') return value;
    return value.name;
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-bg-subtle rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-fg-muted">
          {recurring.length} recurring {recurring.length === 1 ? 'transaction' : 'transactions'}
        </span>
        <Button 
          type="button" 
          onClick={runNow}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1"
        >
          <Play className="w-3.5 h-3.5" />
          Run Due
        </Button>
      </div>

      {recurring.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8" />}
          title="No recurring transactions"
          description="Set up automatic transactions for regular income or expenses."
        />
      ) : (
        <div className="space-y-2">
          {recurring.map((item) => {
            const Icon = item.type === 'income' ? ArrowUpRight : ArrowDownRight;
            const colorClass = item.type === 'income' ? 'text-green-600' : 'text-red-600';
            const bgClass = item.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10';

            return (
              <Card key={item.id} className="overflow-hidden group">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Type Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getName(item.category) || item.type}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-bg-subtle text-fg-muted">
                          {frequencyLabels[item.frequency] || item.frequency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-fg-muted mt-0.5">
                        <Wallet className="w-3 h-3" />
                        <span>{getName(item.account)}</span>
                      </div>
                    </div>

                    {/* Amount & Next Run */}
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${colorClass}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-fg-muted">
                        <Calendar className="w-3 h-3" />
                        <span>Next: {formatDate(item.next_run)}</span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-fg-muted hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete recurring transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

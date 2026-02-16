import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2, Wallet } from 'lucide-react';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';

type TransactionType = 'expense' | 'income' | 'transfer';

type Transaction = {
  id: string;
  amount: string;
  currency: string;
  type: TransactionType;
  memo?: string;
  date: string;
  account: { id: string; name: string } | string;
  category?: { id: string; name: string } | string | null;
  to_account?: { id: string; name: string } | string | null;
};

interface TransactionListProps {
  limit?: number;
  onUpdate?: () => void;
}

const typeConfig = {
  expense: {
    icon: ArrowDownRight,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    prefix: '-',
  },
  income: {
    icon: ArrowUpRight,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    prefix: '+',
  },
  transfer: {
    icon: ArrowLeftRight,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    prefix: '±',
  },
};

export function TransactionList({ limit, onUpdate }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getTransactions({ page_size: limit || 50 });
      setTransactions(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await financeApi.deleteTransaction(id);
      load();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    }
  };

  const getAccountName = (account: Transaction['account']) => {
    if (typeof account === 'string') return account;
    return account?.name || '—';
  };

  const getCategoryName = (category?: Transaction['category']) => {
    if (!category) return null;
    if (typeof category === 'string') return category;
    return category?.name || null;
  };

  const formatAmount = (amount: string, type: TransactionType) => {
    const config = typeConfig[type];
    const num = Number(amount);
    return `${config.prefix}${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-bg-subtle animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-bg-subtle rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-bg-subtle rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-10 h-10" />}
        title="No transactions yet"
        description="Start tracking your finances by adding your first income or expense."
      />
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => {
        const config = typeConfig[t.type];
        const Icon = config.icon;
        const categoryName = getCategoryName(t.category);

        return (
          <div
            key={t.id}
            className="group flex items-center gap-4 p-4 rounded-xl hover:bg-bg-subtle/50 transition-colors"
          >
            {/* Type Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate text-foreground">
                  {t.memo || categoryName || t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-fg-muted mt-1">
                <span>{getAccountName(t.account)}</span>
                {categoryName && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-bg-subtle text-xs">{categoryName}</span>
                  </>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="hidden sm:block text-xs text-fg-muted font-medium">
              {formatDate(t.date)}
            </div>

            {/* Amount */}
            <div className={`text-sm font-bold ${config.color}`}>
              {formatAmount(t.amount, t.type)}
            </div>

            {/* Actions */}
            <button
              onClick={() => handleDelete(t.id)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-fg-muted hover:text-red-500 transition-all"
              title="Delete transaction"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { financeApi } from '../../api';

type Transaction = {
  id: string;
  amount: string;
  currency: string;
  type: string;
  memo?: string;
  date: string;
  account: { id: string; name: string } | string;
  category?: { id: string; name: string } | string | null;
};

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await financeApi.getTransactions({ page_size: 20 });
      setTransactions(res.data.results || res.data);
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

  return (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="text-sm text-muted-foreground">No transactions yet.</div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="p-3 rounded border bg-bg-elevated flex justify-between">
              <div>
                <div className="text-sm font-medium">{getAccountName(t.account)} • {getCategoryName(t.category) || t.type}</div>
                <div className="text-xs text-muted-foreground">{t.memo || 'No memo'}</div>
              </div>
              <div className="text-sm">{t.amount} {t.currency}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

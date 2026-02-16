import { useEffect, useState } from 'react';
import { financeApi } from '../../api';
import { Button } from '../ui/Button';

interface RecurringTransaction {
  id: string;
  amount: string;
  currency: string;
  type: string;
  frequency: string;
  next_run?: string | null;
  account?: { name: string } | string;
  category?: { name: string } | string | null;
}

export function RecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);

  const load = async () => {
    try {
      const res = await financeApi.getRecurring();
      setRecurring(res.data.results || res.data);
    } catch (err) {
      console.error(err);
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

  const getName = (value?: { name: string } | string | null) => {
    if (!value) return '—';
    if (typeof value === 'string') return value;
    return value.name;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" onClick={runNow}>Run due</Button>
      </div>
      {recurring.length === 0 ? (
        <div className="text-sm text-muted-foreground">No recurring transactions yet.</div>
      ) : (
        recurring.map((item) => (
          <div key={item.id} className="p-3 rounded border bg-bg-elevated flex justify-between">
            <div>
              <div className="text-sm font-medium">{getName(item.account)} · {getName(item.category)}</div>
              <div className="text-xs text-muted-foreground">{item.frequency} · next {item.next_run || '—'}</div>
            </div>
            <div className="text-sm">{item.amount} {item.currency}</div>
          </div>
        ))
      )}
    </div>
  );
}

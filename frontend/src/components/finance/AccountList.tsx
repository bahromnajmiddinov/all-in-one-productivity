import { useEffect, useState, type FormEvent } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

type Account = {
  id: string;
  name: string;
  balance: string;
  currency: string;
};

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await financeApi.getAccounts();
      setAccounts(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await financeApi.createAccount({ name, balance: '0.00', currency: 'USD' });
      setName('');
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (accounts.length === 0) {
    return (
      <div>
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New account name" />
          <Button type="submit">Add</Button>
        </form>
        <EmptyState title="No accounts" description="Create an account to start logging transactions." />
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New account name" />
        <Button type="submit">Add</Button>
      </form>
      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="p-3 rounded border bg-bg-elevated flex justify-between">
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.currency}</div>
            </div>
            <div className="text-sm">{a.balance}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

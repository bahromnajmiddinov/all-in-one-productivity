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
  account_type?: string;
};

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('bank');
  const [currency, setCurrency] = useState('USD');

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
      await financeApi.createAccount({ name, balance: '0.00', currency, account_type: accountType });
      setName('');
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const addForm = (
    <form onSubmit={handleAdd} className="space-y-2 mb-4">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New account name" />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="h-10 rounded border border-border bg-background px-3 text-sm"
        >
          <option value="bank">Bank</option>
          <option value="credit">Credit Card</option>
          <option value="cash">Cash</option>
          <option value="investment">Investment</option>
          <option value="loan">Loan</option>
        </select>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-10 rounded border border-border bg-background px-3 text-sm"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add</Button>
      </div>
    </form>
  );

  if (accounts.length === 0) {
    return (
      <div>
        {addForm}
        <EmptyState title="No accounts" description="Create an account to start logging transactions." />
      </div>
    );
  }

  return (
    <div>
      {addForm}
      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="p-3 rounded border bg-bg-elevated flex justify-between">
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.currency} • {a.account_type || 'bank'}</div>
            </div>
            <div className="text-sm">{a.balance}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  parent?: string | null;
};

type IncomeSourceOption = {
  id: string;
  name: string;
};

export function TransactionForm({ onSaved }: { onSaved?: () => void }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [memo, setMemo] = useState('');
  const [account, setAccount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [incomeSource, setIncomeSource] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [accountsRes, categoriesRes, incomeRes] = await Promise.all([
          financeApi.getAccounts(),
          financeApi.getCategories(),
          financeApi.getIncomeSources(),
        ]);
        setAccounts(accountsRes.data.results || accountsRes.data);
        setCategories(categoriesRes.data.results || categoriesRes.data);
        setIncomeSources(incomeRes.data.results || incomeRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !account) return;
    try {
      await financeApi.createTransaction({
        amount,
        type,
        memo,
        account,
        category: category || null,
        income_source: incomeSource || null,
        date: date || undefined,
      });
      setAmount('');
      setMemo('');
      setType('expense');
      setAccount('');
      setCategory('');
      setIncomeSource('');
      setDate('');
      onSaved?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'expense' | 'income' | 'transfer')}
          className="h-10 rounded border border-border bg-background px-3 text-sm"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>
      <select
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
      >
        <option value="">Select account</option>
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>{acc.name}</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded border border-border bg-background px-3 text-sm"
        >
          <option value="">Category (optional)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.parent ? '↳ ' : ''}{cat.name}
            </option>
          ))}
        </select>
        <select
          value={incomeSource}
          onChange={(e) => setIncomeSource(e.target.value)}
          className="h-10 rounded border border-border bg-background px-3 text-sm"
          disabled={type !== 'income'}
        >
          <option value="">Income source</option>
          {incomeSources.map((source) => (
            <option key={source.id} value={source.id}>{source.name}</option>
          ))}
        </select>
      </div>
      <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo" />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

import { useEffect, useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

type CategoryOption = {
  id: string;
  name: string;
  parent?: string | null;
};

export function BudgetForm({ onSaved }: { onSaved?: () => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await financeApi.getCategories();
        setCategories(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !startDate || !endDate) return;
    try {
      await financeApi.createBudget({
        name,
        amount,
        start_date: startDate,
        end_date: endDate,
        category: category || null,
      });
      onSaved?.();
      setName('');
      setAmount('');
      setStartDate('');
      setEndDate('');
      setCategory('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Budget name" />
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.parent ? '↳ ' : ''}{cat.name}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save Budget</Button>
      </div>
    </form>
  );
}

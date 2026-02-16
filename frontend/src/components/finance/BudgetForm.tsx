import { useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function BudgetForm({ onSaved }: { onSaved?: () => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeApi.getBudgets(); // placeholder to ensure API available
      // createBudget endpoint not implemented client-side yet
      onSaved?.();
      setName(''); setAmount(''); setStartDate(''); setEndDate('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Budget name" />
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
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

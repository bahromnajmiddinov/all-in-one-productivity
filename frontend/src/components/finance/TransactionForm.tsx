import { useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function TransactionForm({ onSaved }: { onSaved?: () => void }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense'|'income'|'transfer'>('expense');
  const [memo, setMemo] = useState('');
  const [account, setAccount] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeApi.createTransaction({ amount, type, memo, account });
      setAmount(''); setMemo(''); setType('expense'); setAccount(null);
      onSaved?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>
      <Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Memo" />
      <div className="flex justify-end">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

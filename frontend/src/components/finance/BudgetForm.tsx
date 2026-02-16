import { useEffect, useState } from 'react';
import { PiggyBank, Calendar, Tag, DollarSign } from 'lucide-react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

type CategoryOption = {
  id: string;
  name: string;
  parent?: string | null;
};

interface BudgetFormProps {
  onSaved?: () => void;
}

export function BudgetForm({ onSaved }: BudgetFormProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);

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

    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !startDate || !endDate) return;

    try {
      setLoading(true);
      await financeApi.createBudget({
        name,
        amount,
        start_date: startDate,
        end_date: endDate,
        category: category || null,
      });
      
      setName('');
      setAmount('');
      onSaved?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Budget Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Budget Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Monthly Groceries"
          required
        />
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          Budget Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">$</span>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="pl-7"
            required
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <PiggyBank className="w-3 h-3" />
          Category (Optional)
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.parent ? '↳ ' : ''}{cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Budget Period
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-fg-muted block mb-1">Start</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-fg-muted block mb-1">End</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !name || !amount || !startDate || !endDate}
      >
        {loading ? 'Creating...' : 'Create Budget'}
      </Button>
    </form>
  );
}

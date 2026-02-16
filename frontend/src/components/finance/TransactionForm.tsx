import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Calendar, FileText, Tag, Wallet } from 'lucide-react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

type TransactionType = 'expense' | 'income' | 'transfer';

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

interface TransactionFormProps {
  onSaved?: () => void;
}

const typeConfig: Record<TransactionType, { label: string; icon: typeof ArrowDownRight; color: string }> = {
  expense: { label: 'Expense', icon: ArrowDownRight, color: 'text-red-600' },
  income: { label: 'Income', icon: ArrowUpRight, color: 'text-green-600' },
  transfer: { label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600' },
};

export function TransactionForm({ onSaved }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [memo, setMemo] = useState('');
  const [account, setAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [incomeSource, setIncomeSource] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceOption[]>([]);
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      await financeApi.createTransaction({
        amount,
        type,
        memo,
        account,
        category: category || null,
        income_source: incomeSource || null,
        date: date || undefined,
      });
      
      // Reset form
      setAmount('');
      setMemo('');
      setCategory('');
      setIncomeSource('');
      setToAccount('');
      setDate(new Date().toISOString().split('T')[0]);
      
      onSaved?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentType = typeConfig[type];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(typeConfig) as TransactionType[]).map((t) => {
          const config = typeConfig[t];
          const Icon = config.icon;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg border text-sm font-medium transition-all
                ${type === t 
                  ? 'border-foreground bg-foreground/5 text-foreground' 
                  : 'border-border bg-bg-subtle text-fg-muted hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${type === t ? config.color : ''}`} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted">Amount</label>
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

      {/* Account Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <Wallet className="w-3 h-3" />
          {type === 'transfer' ? 'From Account' : 'Account'}
        </label>
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="h-10 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          required
        >
          <option value="">Select account...</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
      </div>

      {/* Transfer To Account */}
      {type === 'transfer' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            To Account
          </label>
          <select
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <option value="">Select destination...</option>
            {accounts.filter(a => a.id !== account).map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Category & Income Source */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <option value="">Select...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parent ? '↳ ' : ''}{cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Income Source
          </label>
          <select
            value={incomeSource}
            onChange={(e) => setIncomeSource(e.target.value)}
            disabled={type !== 'income'}
            className="h-10 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select...</option>
            {incomeSources.map((source) => (
              <option key={source.id} value={source.id}>{source.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date & Memo */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Date
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-fg-muted flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Description
        </label>
        <Input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="What was this for?"
        />
      </div>

      {/* Submit */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !amount || !account}
      >
        {loading ? 'Saving...' : `Add ${currentType.label}`}
      </Button>
    </form>
  );
}

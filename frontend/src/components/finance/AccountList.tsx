import { useEffect, useState, type FormEvent } from 'react';
import { 
  Landmark, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Receipt, 
  Plus,
  Building2
} from 'lucide-react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

type AccountType = 'bank' | 'credit' | 'cash' | 'investment' | 'loan';

type Account = {
  id: string;
  name: string;
  balance: string;
  currency: string;
  account_type?: AccountType;
};

interface AccountListProps {
  onUpdate?: () => void;
}

const accountTypeConfig: Record<AccountType, { icon: typeof Wallet; label: string; color: string; bgColor: string }> = {
  bank: { icon: Building2, label: 'Bank Account', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  credit: { icon: CreditCard, label: 'Credit Card', color: 'text-red-600', bgColor: 'bg-red-500/10' },
  cash: { icon: Wallet, label: 'Cash', color: 'text-green-600', bgColor: 'bg-green-500/10' },
  investment: { icon: TrendingUp, label: 'Investment', color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
  loan: { icon: Receipt, label: 'Loan', color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
};

const currencyOptions = [
  { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP (£)', flag: '🇬🇧' },
  { value: 'JPY', label: 'JPY (¥)', flag: '🇯🇵' },
];

export function AccountList({ onUpdate }: AccountListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getAccounts();
      setAccounts(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await financeApi.createAccount({ name, balance: '0.00', currency, account_type: accountType });
      setName('');
      setShowForm(false);
      load();
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  };

  const formatBalance = (balance: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Number(balance));
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    const multiplier = acc.account_type === 'credit' || acc.account_type === 'loan' ? -1 : 1;
    return sum + (Number(acc.balance) * multiplier);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="w-12 h-12 rounded-xl bg-bg-subtle animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-bg-subtle rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-bg-subtle rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (accounts.length === 0 && !showForm) {
    return (
      <EmptyState
        icon={<Landmark className="w-10 h-10" />}
        title="No accounts yet"
        description="Create an account to start tracking your finances and transactions."
        action={
          <Button onClick={() => setShowForm(true)} variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Account
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Account Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg bg-bg-subtle space-y-3">
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Account name (e.g., Chase Checking)"
            className="bg-bg-elevated"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {Object.entries(accountTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {currencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.flag} {opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Accounts List */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const accountConfig = accountTypeConfig[account.account_type || 'bank'];
          const Icon = accountConfig.icon;
          const isNegative = account.account_type === 'credit' || account.account_type === 'loan';

          return (
            <Card key={account.id} className="overflow-hidden hover:shadow-soft transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${accountConfig.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${accountConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{account.name}</div>
                    <div className="text-xs text-fg-muted">{accountConfig.label}</div>
                  </div>
                  <div className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-foreground'}`}>
                    {formatBalance(account.balance, account.currency)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Button (when form is hidden) */}
      {!showForm && (
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New Account
        </Button>
      )}

      {/* Total Balance */}
      {accounts.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-fg-muted">Total Balance</span>
            <span className={`text-lg font-semibold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              }).format(totalBalance)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

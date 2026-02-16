import { useEffect, useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Holding {
  id: string;
  name: string;
  symbol: string;
  asset_type: string;
  quantity: number;
  cost_basis: number;
  current_value: number;
  currency: string;
  account?: string | null;
  gain: number;
  gain_percent: number;
}

interface PortfolioData {
  total_cost: number;
  total_value: number;
  total_gain: number;
  holdings: Holding[];
}

interface AccountOption {
  id: string;
  name: string;
}

export function InvestmentPortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState('stock');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [account, setAccount] = useState('');

  const load = async () => {
    try {
      const [portfolioRes, accountsRes] = await Promise.all([
        financeApi.getInvestmentPerformance(),
        financeApi.getAccounts(),
      ]);
      setPortfolio(portfolioRes.data);
      setAccounts(accountsRes.data.results || accountsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentValue) return;
    try {
      await financeApi.createInvestment({
        name,
        symbol,
        asset_type: assetType,
        quantity: quantity || '0',
        cost_basis: costBasis || '0',
        current_value: currentValue,
        account: account || null,
      });
      setName('');
      setSymbol('');
      setAssetType('stock');
      setQuantity('');
      setCostBasis('');
      setCurrentValue('');
      setAccount('');
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Investment name" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Ticker" />
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="h-10 rounded border border-border bg-background px-3 text-sm"
          >
            <option value="stock">Stock</option>
            <option value="fund">Fund</option>
            <option value="crypto">Crypto</option>
            <option value="bond">Bond</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" />
          <Input value={costBasis} onChange={(e) => setCostBasis(e.target.value)} placeholder="Cost basis" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="Current value" />
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="h-10 rounded border border-border bg-background px-3 text-sm"
          >
            <option value="">Linked account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Add holding</Button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Total value</div>
          <div className="text-lg font-semibold">{portfolio?.total_value.toFixed(2) ?? '—'}</div>
        </div>
        <div className="p-3 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Total cost</div>
          <div className="text-lg font-semibold">{portfolio?.total_cost.toFixed(2) ?? '—'}</div>
        </div>
        <div className="p-3 rounded border bg-bg-elevated">
          <div className="text-xs text-muted-foreground">Total gain</div>
          <div className={`text-lg font-semibold ${portfolio && portfolio.total_gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {portfolio?.total_gain.toFixed(2) ?? '—'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {portfolio?.holdings?.length ? (
          portfolio.holdings.map((holding) => (
            <div key={holding.id} className="p-3 rounded border bg-bg-elevated flex justify-between">
              <div>
                <div className="text-sm font-medium">{holding.name} {holding.symbol ? `(${holding.symbol})` : ''}</div>
                <div className="text-xs text-muted-foreground">{holding.asset_type} · {holding.account || 'No account'}</div>
              </div>
              <div className="text-sm text-right">
                <div>{holding.current_value.toFixed(2)}</div>
                <div className={`text-xs ${holding.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {holding.gain >= 0 ? '+' : ''}{holding.gain.toFixed(2)} ({holding.gain_percent}%)
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No investments tracked yet.</div>
        )}
      </div>
    </div>
  );
}

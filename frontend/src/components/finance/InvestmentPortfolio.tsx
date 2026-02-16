import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Package, Building2, Plus, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

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

const assetTypeOptions = [
  { value: 'stock', label: 'Stock', icon: TrendingUp },
  { value: 'fund', label: 'Fund', icon: Package },
  { value: 'crypto', label: 'Crypto', icon: DollarSign },
  { value: 'bond', label: 'Bond', icon: Building2 },
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'other', label: 'Other', icon: Package },
];

export function InvestmentPortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState('stock');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [portfolioRes, accountsRes] = await Promise.all([
        financeApi.getInvestmentPerformance(),
        financeApi.getAccounts(),
      ]);
      setPortfolio(portfolioRes.data);
      setAccounts(accountsRes.data.results || accountsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    try {
      await financeApi.deleteInvestment(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-subtle rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-fg-muted mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Total Value</span>
            </div>
            <div className="text-2xl font-semibold">
              {portfolio ? formatCurrency(portfolio.total_value) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-fg-muted mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs">Total Cost</span>
            </div>
            <div className="text-2xl font-semibold">
              {portfolio ? formatCurrency(portfolio.total_cost) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card className={portfolio && portfolio.total_gain >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-fg-muted mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Total Gain/Loss</span>
            </div>
            <div className={`text-2xl font-semibold flex items-center gap-1 ${portfolio && portfolio.total_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio && portfolio.total_gain >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              {portfolio ? formatCurrency(Math.abs(portfolio.total_gain)) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Investment Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Add New Investment</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Investment name" required />
                <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Ticker symbol" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="h-10 rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {assetTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="h-10 rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="">Linked account (optional)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" type="number" step="0.0001" />
                <Input value={costBasis} onChange={(e) => setCostBasis(e.target.value)} placeholder="Cost basis" type="number" step="0.01" />
                <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="Current value" type="number" step="0.01" required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Holding
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Holdings List */}
      {!showForm && (
        <>
          {portfolio?.holdings?.length ? (
            <div className="space-y-2">
              {portfolio.holdings.map((holding) => (
                <Card key={holding.id} className="overflow-hidden group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Asset Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${holding.gain >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                        {holding.gain >= 0 ? (
                          <TrendingUp className={`w-5 h-5 ${holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                        )}
                      </div>

                      {/* Holding Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{holding.name}</span>
                          {holding.symbol && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-bg-subtle text-fg-muted">
                              {holding.symbol}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-fg-muted">
                          {holding.quantity.toFixed(4)} {holding.asset_type} · {holding.account || 'No account'}
                        </div>
                      </div>

                      {/* Value & Gain */}
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(holding.current_value)}</div>
                        <div className={`text-xs flex items-center justify-end gap-1 ${holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.gain >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {holding.gain_percent}%
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(holding.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-fg-muted hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete investment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="w-8 h-8" />}
              title="No investments yet"
              description="Add your stocks, funds, crypto, and other investments to track your portfolio."
              action={
                <Button onClick={() => setShowForm(true)} variant="secondary" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Investment
                </Button>
              }
            />
          )}

          {!showForm && portfolio?.holdings && portfolio.holdings.length > 0 && (
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Another Investment
            </Button>
          )}
        </>
      )}
    </div>
  );
}

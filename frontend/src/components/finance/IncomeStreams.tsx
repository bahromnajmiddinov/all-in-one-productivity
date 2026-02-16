import { useEffect, useState } from 'react';
import { TrendingUp, Plus, DollarSign, Wallet, Trash2 } from 'lucide-react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

interface IncomeSource {
  id: string;
  name: string;
  description?: string;
}

interface IncomeTotal {
  source: string;
  total: number;
}

interface IncomeStreamsProps {
  onUpdate?: () => void;
}

export function IncomeStreams({ onUpdate }: IncomeStreamsProps) {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [totals, setTotals] = useState<IncomeTotal[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [sourceRes, totalRes] = await Promise.all([
        financeApi.getIncomeSources(),
        financeApi.getIncomeStreamTotals(),
      ]);
      setSources(sourceRes.data.results || sourceRes.data);
      setTotals(totalRes.data || []);
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
    if (!name.trim()) return;
    try {
      await financeApi.createIncomeSource({ name, description });
      setName('');
      setDescription('');
      setShowForm(false);
      load();
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income source?')) return;
    try {
      await financeApi.deleteIncomeSource(id);
      load();
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMap = totals.reduce<Record<string, number>>((acc, item) => {
    acc[item.source] = item.total;
    return acc;
  }, {});

  const totalIncome = Object.values(totalMap).reduce((sum, val) => sum + val, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-bg-subtle rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-3 rounded-lg bg-bg-subtle space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Income source name (e.g., Salary)"
            className="bg-bg-elevated"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="bg-bg-elevated"
          />
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

      {/* Sources List */}
      {sources.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-6 h-6" />}
          title="No income sources"
          description="Add income sources to track where your money comes from."
        />
      ) : (
        <div className="space-y-2">
          {sources.map((source) => {
            const amount = totalMap[source.name] || 0;
            const percent = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;

            return (
              <Card key={source.id} className="overflow-hidden group">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{source.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(amount)}
                          </span>
                          <button
                            onClick={() => handleDelete(source.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-fg-muted hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete income source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {source.description && (
                        <p className="text-xs text-fg-muted truncate">{source.description}</p>
                      )}
                      {percent > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-xs text-fg-muted mt-1">
                            {percent.toFixed(1)}% of total income
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Total Income */}
      {sources.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center px-2">
            <span className="text-sm font-medium text-fg-muted flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              Total Income
            </span>
            <span className="text-lg font-semibold text-green-600">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Income Source
        </Button>
      )}
    </div>
  );
}

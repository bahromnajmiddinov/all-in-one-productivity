import { useEffect, useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface IncomeSource {
  id: string;
  name: string;
  description?: string;
}

interface IncomeTotal {
  source: string;
  total: number;
}

export function IncomeStreams() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [totals, setTotals] = useState<IncomeTotal[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    try {
      const [sourceRes, totalRes] = await Promise.all([
        financeApi.getIncomeSources(),
        financeApi.getIncomeStreamTotals(),
      ]);
      setSources(sourceRes.data.results || sourceRes.data);
      setTotals(totalRes.data || []);
    } catch (err) {
      console.error(err);
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
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMap = totals.reduce<Record<string, number>>((acc, item) => {
    acc[item.source] = item.total;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Income source name" />
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        <div className="flex justify-end">
          <Button type="submit">Add</Button>
        </div>
      </form>
      <div className="space-y-2">
        {sources.length === 0 ? (
          <div className="text-sm text-muted-foreground">No income sources added.</div>
        ) : (
          sources.map((source) => (
            <div key={source.id} className="p-3 rounded border bg-bg-elevated flex justify-between">
              <div>
                <div className="text-sm font-medium">{source.name}</div>
                <div className="text-xs text-muted-foreground">{source.description || '—'}</div>
              </div>
              <div className="text-sm">{(totalMap[source.name] || 0).toFixed(2)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

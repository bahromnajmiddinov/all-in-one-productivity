import { useEffect, useMemo, useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';

interface HeatmapEntry {
  date: string;
  category: string;
  total: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function CategoryHeatmap() {
  const [entries, setEntries] = useState<HeatmapEntry[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [heatmapRes, categoryRes] = await Promise.all([
          financeApi.getCategoryHeatmap({ days: 60 }),
          financeApi.getCategories(),
        ]);
        setEntries(heatmapRes.data || []);
        setCategories(categoryRes.data.results || categoryRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 28 }, (_, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (27 - idx));
      return date.toISOString().slice(0, 10);
    });
  }, []);

  const totalsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    entries
      .filter((entry) => (selectedCategory ? entry.category === selectedCategory : true))
      .forEach((entry) => {
        map[entry.date] = (map[entry.date] || 0) + entry.total;
      });
    return map;
  }, [entries, selectedCategory]);

  const maxValue = Math.max(...Object.values(totalsByDate), 0);

  const getColor = (value: number) => {
    if (value === 0) return 'hsl(var(--bg-subtle))';
    const intensity = maxValue ? value / maxValue : 0;
    const alpha = Math.min(0.2 + intensity * 0.7, 0.9);
    return `rgba(59, 130, 246, ${alpha})`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'narrow' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-bg-subtle rounded-lg animate-pulse" />
        <div className="h-40 bg-bg-subtle rounded-lg animate-pulse" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        title="No spending data"
        description="Add categorized transactions to see your spending heatmap."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-fg-muted" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 flex-1 rounded-md border border-border bg-bg-subtle px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((alpha, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: `rgba(59, 130, 246, ${alpha})` }}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div key={day} className="flex flex-col items-center">
            <div
              className="w-9 h-9 rounded-md transition-all hover:scale-110 cursor-pointer"
              style={{ backgroundColor: getColor(totalsByDate[day] || 0) }}
              title={`${new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${formatCurrency(totalsByDate[day] || 0)}`}
            />
            <div className="text-[10px] text-fg-muted mt-1">{getDayLabel(day)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

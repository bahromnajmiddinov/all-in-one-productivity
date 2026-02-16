import { useEffect, useMemo, useState } from 'react';
import { financeApi } from '../../api';

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

  useEffect(() => {
    const load = async () => {
      try {
        const [heatmapRes, categoryRes] = await Promise.all([
          financeApi.getCategoryHeatmap({ days: 60 }),
          financeApi.getCategories(),
        ]);
        setEntries(heatmapRes.data || []);
        setCategories(categoryRes.data.results || categoryRes.data);
      } catch (err) {
        console.error(err);
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
    if (value === 0) return 'hsl(var(--border-subtle))';
    const intensity = maxValue ? value / maxValue : 0;
    const alpha = Math.min(0.15 + intensity * 0.6, 0.8);
    return `rgba(59, 130, 246, ${alpha})`;
  };

  return (
    <div className="space-y-3">
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>{cat.name}</option>
        ))}
      </select>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day} className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: getColor(totalsByDate[day] || 0) }}
              title={`${day}: ${(totalsByDate[day] || 0).toFixed(2)}`}
            />
            <div className="text-[10px] text-muted-foreground mt-1">{day.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

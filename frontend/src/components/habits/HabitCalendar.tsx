import { useEffect, useState } from 'react';
import { habitApi } from '../../api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function HabitCalendar() {
  const [completions, setCompletions] = useState<Record<string, string[]>>({});
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    let cancelled = false;
    habitApi.getCalendar(year, month).then((res) => {
      if (!cancelled) setCompletions(res.data.completions || {});
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [year, month]);

  const end = new Date(year, month, 0);
  const daysInMonth = end.getDate();
  const start = new Date(year, month - 1, 1);
  const startDay = start.getDay();
  const padStart = startDay === 0 ? 6 : startDay - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < padStart; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-lg text-fg-muted hover:text-foreground hover:bg-bg-subtle transition-smooth"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <span className="text-sm font-medium text-foreground">
          {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 rounded-lg text-fg-muted hover:text-foreground hover:bg-bg-subtle transition-smooth"
          aria-label="Next month"
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-caption mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-fg-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const count = (completions[dateStr] || []).length;
          return (
            <div
              key={i}
              className={cn(
                'aspect-square flex items-center justify-center rounded-md text-sm transition-smooth',
                count > 0
                  ? 'bg-foreground/15 text-foreground'
                  : 'bg-bg-subtle/50 text-fg-subtle'
              )}
              title={count > 0 ? `${count} habit(s) completed` : 'No completions'}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Habit, HabitCategory } from '../../types/habits';

const WEEKDAYS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

const toTimeString = (minutes?: number | null) => {
  if (minutes == null) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const toMinutes = (value: string) => {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export function HabitForm({
  onSave,
  onCancel,
  initial,
  categories,
}: {
  onSave: (data: Partial<Habit>) => void;
  onCancel: () => void;
  initial?: Habit | null;
  categories: HabitCategory[];
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>(initial?.frequency ?? 'daily');
  const [targetWeekdays, setTargetWeekdays] = useState<number[]>(initial?.target_weekdays ?? [0, 1, 2, 3, 4]);
  const [customInterval, setCustomInterval] = useState<number | ''>(initial?.custom_interval_days ?? '');
  const [categoryId, setCategoryId] = useState<string>(initial?.category?.id ?? '');
  const [preferredTime, setPreferredTime] = useState<string>(toTimeString(initial?.preferred_times?.[0]));

  const toggleWeekday = (d: number) => {
    setTargetWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const minutes = toMinutes(preferredTime);
    const data: Partial<Habit> = {
      name: name.trim(),
      description: description.trim(),
      frequency,
      target_weekdays: frequency === 'weekly' ? targetWeekdays : [],
      custom_interval_days: frequency === 'custom' && customInterval !== '' ? Number(customInterval) : null,
      category_id: categoryId || null,
      preferred_times: minutes != null ? [minutes] : [],
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 rounded-[var(--radius)] border border-border bg-bg-elevated shadow-soft">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning run"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'custom')}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom interval</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>
      {frequency === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Days</label>
          <div className="flex flex-wrap gap-3">
            {WEEKDAYS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetWeekdays.includes(value)}
                  onChange={() => toggleWeekday(value)}
                  className="rounded border-border"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {frequency === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Custom interval (days)</label>
          <Input
            type="number"
            min={1}
            value={customInterval}
            onChange={(e) => setCustomInterval(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 3"
            required
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Preferred time (optional)</label>
        <Input
          type="time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
        />
        <p className="text-caption mt-1">Used to seed smart reminders and time-of-day analytics.</p>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit">{initial ? 'Update' : 'Create'} habit</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

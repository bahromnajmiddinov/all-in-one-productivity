import { useState, type FormEvent } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Task, RecurrenceRule } from '../../types';

const PRIORITIES = [
  { value: 1, label: 'P1 Low' },
  { value: 2, label: 'P2 Medium' },
  { value: 3, label: 'P3 High' },
  { value: 4, label: 'P4 Urgent' },
];
const ENERGY_LEVELS = [1, 2, 3, 4, 5];
const WEEKDAYS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

interface TaskFormProps {
  initial?: Task | null;
  onSave: (data: Partial<Task>) => void;
  onCancel: () => void;
}

export function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState(initial?.priority ?? 2);
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimated_minutes ?? '');
  const [actualMinutes, setActualMinutes] = useState(initial?.actual_minutes ?? '');
  const [energyLevel, setEnergyLevel] = useState<number | ''>(initial?.energy_level ?? '');
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(initial?.recurrence_rule ?? null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || undefined,
      estimated_minutes: estimatedMinutes === '' ? undefined : Number(estimatedMinutes),
      actual_minutes: actualMinutes === '' ? undefined : Number(actualMinutes),
      energy_level: energyLevel === '' ? undefined : Number(energyLevel),
      recurrence_rule: recurrence,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 rounded-[var(--radius)] border border-border bg-bg-elevated">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Due date</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Est. time (min)</label>
          <Input
            type="number"
            min={0}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Actual time (min)</label>
          <Input
            type="number"
            min={0}
            value={actualMinutes}
            onChange={(e) => setActualMinutes(e.target.value)}
            placeholder="—"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Energy level (1–5)</label>
        <select
          value={energyLevel}
          onChange={(e) => setEnergyLevel(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">—</option>
          {ENERGY_LEVELS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Recurrence</label>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={recurrence?.frequency ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) setRecurrence(null);
              else setRecurrence({ frequency: v as RecurrenceRule['frequency'], interval: 1 });
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {recurrence && (
            <>
              <span className="text-fg-muted text-sm">every</span>
              <input
                type="number"
                min={1}
                value={recurrence.interval ?? 1}
                onChange={(e) => setRecurrence({ ...recurrence, interval: Number(e.target.value) || 1 })}
                className="w-16 h-10 rounded-md border border-border bg-background px-2 text-sm text-foreground"
              />
              {recurrence.frequency === 'weekly' && (
                <div className="flex gap-1 flex-wrap">
                  {WEEKDAYS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={(recurrence.weekdays ?? []).includes(value)}
                        onChange={() => {
                          const w = recurrence.weekdays ?? [];
                          setRecurrence({
                            ...recurrence,
                            weekdays: w.includes(value) ? w.filter((x) => x !== value) : [...w, value].sort((a, b) => a - b),
                          });
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit">{initial ? 'Update' : 'Create'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

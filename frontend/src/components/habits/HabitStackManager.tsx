import { useEffect, useMemo, useState } from 'react';
import { Link } from 'lucide-react';
import { habitApi } from '../../api';
import type { Habit, HabitStack } from '../../types/habits';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

export function HabitStackManager({ habits }: { habits: Habit[] }) {
  const [stacks, setStacks] = useState<HabitStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousId, setPreviousId] = useState('');
  const [nextId, setNextId] = useState('');
  const [gapMinutes, setGapMinutes] = useState<number | ''>(15);

  const habitOptions = useMemo(
    () => habits.map((habit) => ({ value: habit.id, label: habit.name })),
    [habits]
  );

  const loadStacks = async () => {
    setLoading(true);
    try {
      const res = await habitApi.getStacks();
      setStacks(Array.isArray(res.data) ? res.data : (res.data as any).results ?? []);
    } catch (error) {
      console.error('Failed to load stacks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStacks();
  }, []);

  const handleCreate = async () => {
    if (!previousId || !nextId || previousId === nextId) return;
    try {
      await habitApi.createStack({
        previous: previousId,
        next: nextId,
        gap_minutes: gapMinutes === '' ? 0 : Number(gapMinutes),
        order: stacks.length,
      });
      setPreviousId('');
      setNextId('');
      setGapMinutes(15);
      loadStacks();
    } catch (error) {
      console.error('Failed to create stack', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this habit stack?')) return;
    try {
      await habitApi.deleteStack(id);
      loadStacks();
    } catch (error) {
      console.error('Failed to delete stack', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="size-4 text-fg-muted" />
          Habit stacking
        </CardTitle>
        <CardDescription>Link habits together to build routines.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
          <select
            value={previousId}
            onChange={(e) => setPreviousId(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Previous habit</option>
            {habitOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={nextId}
            onChange={(e) => setNextId(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Next habit</option>
            {habitOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Input
            type="number"
            min={0}
            value={gapMinutes}
            onChange={(e) => setGapMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Gap (min)"
          />
          <Button type="button" onClick={handleCreate}>
            Add stack
          </Button>
        </div>

        {loading ? (
          <p className="text-caption text-fg-muted">Loading stacks...</p>
        ) : stacks.length === 0 ? (
          <p className="text-caption text-fg-muted">No stacks configured yet.</p>
        ) : (
          <ul className="space-y-2">
            {stacks.map((stack) => (
              <li
                key={stack.id}
                className="flex flex-col gap-1 rounded-lg border border-border/70 bg-bg-subtle/40 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {stack.previous_name ?? stack.previous} → {stack.next_name ?? stack.next}
                  </p>
                  <p className="text-caption text-fg-muted">Gap {stack.gap_minutes} min</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(stack.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

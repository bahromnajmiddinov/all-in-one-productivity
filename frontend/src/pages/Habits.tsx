import { useEffect, useState } from 'react';
import { habitApi } from '../api';
import { HabitList } from '../components/habits/HabitList';
import { HabitCalendar } from '../components/habits/HabitCalendar';
import { HabitForm } from '../components/habits/HabitForm';
import { HabitReminders } from '../components/habits/HabitReminders';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Target } from 'lucide-react';
import type { Habit } from '../types/habits';

export function Habits() {
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await habitApi.getHabits();
      const data = res.data;
      setAllHabits(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch (e) {
      console.error('Failed to load habits', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (data: Partial<Habit>) => {
    try {
      if (editing) {
        await habitApi.updateHabit(editing.id, data);
      } else {
        await habitApi.createHabit(data);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e) {
      console.error('Failed to save habit', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await habitApi.deleteHabit(id);
      load();
    } catch (e) {
      console.error('Failed to delete habit', e);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1">Habits</h1>
          <p className="text-body mt-1">Track daily and weekly habits with streaks.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          Add habit
        </Button>
      </div>

      <section className="mb-8">
        <h2 className="text-h3 mb-4">Today</h2>
        <HabitList />
      </section>

      <section className="mb-8">
        <h2 className="text-h3 mb-4">All habits</h2>
        {showForm && (
          <div className="mb-6">
            <HabitForm
              key={editing?.id ?? 'new'}
              initial={editing ?? undefined}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        )}
        {loading ? (
          <p className="text-body text-fg-muted">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {allHabits.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-bg-elevated px-4 py-3 shadow-soft transition-smooth hover:border-border/80"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{h.name}</p>
                  <p className="text-caption mt-0.5">
                    {h.frequency === 'weekly'
                      ? `Weekly (${(h.target_weekdays || []).length} days)`
                      : 'Daily'}
                    {' · '}
                    Streak {h.current_streak} · Best {h.longest_streak}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(h); setShowForm(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(h.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {!loading && allHabits.length === 0 && !showForm && (
          <EmptyState
            icon={<Target className="size-10" strokeWidth={1} />}
            title="No habits yet"
            description="Create a habit to start tracking consistency and streaks."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
                Add habit
              </Button>
            }
          />
        )}
      </section>

      <section>
        <h2 className="text-h3 mb-4">Monthly view</h2>
        <HabitCalendar />
      </section>
      <section className="mt-8">
        <h2 className="text-h3 mb-4">Reminders</h2>
        <HabitReminders />
      </section>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { habitApi } from '../../api';
import type { HabitReminder, Habit } from '../../types/habits';
import { Button } from '../ui/Button';

export const HabitReminders: React.FC = () => {
  const [reminders, setReminders] = useState<HabitReminder[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const load = async () => {
    try {
      const [r, h] = await Promise.all([habitApi.getReminders(), habitApi.getHabits()]);
      setReminders(Array.isArray(r.data) ? r.data : (r.data as any).results ?? []);
      setHabits(Array.isArray(h.data) ? h.data : (h.data as any).results ?? []);
    } catch (e) {
      console.error('Failed to load reminders', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSuggest = async (id: string) => {
    try {
      const res = await habitApi.suggestReminderTime(id);
      alert(`Suggested time (minutes from midnight): ${res.data.suggestion_minutes}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await habitApi.deleteReminder(id);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Reminders</h3>
        <Button size="sm" variant="ghost" onClick={load}>Refresh</Button>
      </div>
      {reminders.length === 0 ? (
        <p className="text-caption text-fg-muted">No reminders configured.</p>
      ) : (
        <ul className="space-y-3">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{r.habit_name ?? r.habit}</p>
                <p className="text-caption text-fg-muted">{r.smart ? 'Smart' : 'Static'} · Times: {(r.times || []).join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleSuggest(r.id)}>Suggest</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

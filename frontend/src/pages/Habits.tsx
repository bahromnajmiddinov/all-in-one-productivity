import { useEffect, useState } from 'react';
import { habitApi } from '../api';
import { HabitList } from '../components/habits/HabitList';
import { HabitCalendar } from '../components/habits/HabitCalendar';
import { HabitForm } from '../components/habits/HabitForm';
import { HabitReminders } from '../components/habits/HabitReminders';
import { HabitAnalyticsDashboard } from '../components/habits/HabitAnalyticsDashboard';
import { HabitCorrelationMatrix } from '../components/habits/HabitCorrelationMatrix';
import { HabitChains } from '../components/habits/HabitChains';
import { HabitTimeOfDayInsights } from '../components/habits/HabitTimeOfDayInsights';
import { HabitStackManager } from '../components/habits/HabitStackManager';
import { HabitCategoryManager } from '../components/habits/HabitCategoryManager';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Plus, Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import type { Habit, HabitCategory } from '../types/habits';

export function Habits() {
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [habitsRes, categoriesRes] = await Promise.all([
        habitApi.getHabits(),
        habitApi.getCategories(),
      ]);
      const habitsData = habitsRes.data;
      const categoriesData = categoriesRes.data;
      setAllHabits(Array.isArray(habitsData) ? habitsData : (habitsData as any).results ?? []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData as any).results ?? []);
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
      await load();
    } catch (e) {
      console.error('Failed to save habit', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await habitApi.deleteHabit(id);
      await load();
    } catch (e) {
      console.error('Failed to delete habit', e);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      await habitApi.createCategory({ name });
      await load();
    } catch (e) {
      console.error('Failed to create category', e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await habitApi.deleteCategory(id);
      await load();
    } catch (e) {
      console.error('Failed to delete category', e);
    }
  };

  const handleAddClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEditClick = (habit: Habit) => {
    setEditing(habit);
    setShowForm(true);
  };

  const handleDialogClose = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-[var(--radius)] bg-success-subtle text-success">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-h1">Habits</h1>
          </div>
          <p className="text-body max-w-2xl">
            Track daily and weekly habits with streaks. Build consistency and achieve your goals 
            through positive habit formation.
          </p>
        </div>
        <Button onClick={handleAddClick} className="flex-shrink-0">
          <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
          Add Habit
        </Button>
      </div>

      {/* Today's Habits */}
      <section className="section-gap-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-fg-muted" />
          <h2 className="text-h3">Today</h2>
        </div>
        <HabitList />
      </section>

      {/* All Habits */}
      <section className="section-gap-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-fg-muted" />
          <h2 className="text-h3">All Habits</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-bg-subtle rounded-[var(--radius)] animate-pulse" />
            ))}
          </div>
        ) : allHabits.length === 0 ? (
          <EmptyState
            icon={<Target className="w-10 h-10" strokeWidth={1} />}
            title="No habits yet"
            description="Create a habit to start tracking consistency and streaks."
            action={
              <Button onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                Add Habit
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {allHabits.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-border bg-bg-elevated px-4 py-3 shadow-card transition-fast hover:shadow-card-hover hover:border-border-hover"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{h.name}</p>
                  <p className="text-caption mt-0.5">
                    {h.frequency === 'weekly'
                      ? `Weekly (${(h.target_weekdays || []).length} days)`
                      : h.frequency === 'custom'
                      ? `Every ${h.custom_interval_days ?? '?'} days`
                      : 'Daily'}
                    {h.category?.name ? ` · ${h.category.name}` : ''}
                    {' · '}
                    Streak {h.current_streak} · Best {h.longest_streak}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(h)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive" 
                    onClick={() => handleDelete(h.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Analytics */}
      <section className="section-gap-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-fg-muted" />
          <h2 className="text-h3">Analytics</h2>
        </div>
        <HabitAnalyticsDashboard />
      </section>

      {/* Grid Sections */}
      <section className="section-gap-sm grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-fg-muted" />
            <h2 className="text-h3">Time of Day Insights</h2>
          </div>
          <HabitTimeOfDayInsights />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-fg-muted" />
            <h2 className="text-h3">Habit Chains</h2>
          </div>
          <HabitChains />
        </div>
      </section>

      {/* Correlation Matrix */}
      <section className="section-gap-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-fg-muted" />
          <h2 className="text-h3">Correlation Matrix</h2>
        </div>
        <HabitCorrelationMatrix />
      </section>

      {/* Stack & Category Managers */}
      <section className="section-gap-sm grid gap-6 lg:grid-cols-2">
        <HabitStackManager habits={allHabits} />
        <HabitCategoryManager
          categories={categories}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
        />
      </section>

      {/* Monthly View */}
      <section className="section-gap-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-fg-muted" />
          <h2 className="text-h3">Monthly View</h2>
        </div>
        <HabitCalendar />
      </section>

      {/* Reminders */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-fg-muted" />
          <h2 className="text-h3">Reminders</h2>
        </div>
        <HabitReminders />
      </section>

      {/* Habit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <HabitForm
              key={editing?.id ?? 'new'}
              initial={editing ?? undefined}
              categories={categories}
              onSave={handleSave}
              onCancel={handleDialogClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

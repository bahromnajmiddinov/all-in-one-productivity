export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_weekdays: number[];
  custom_interval_days?: number | null;
  preferred_times?: number[];
  order: number;
  is_archived: boolean;
  created_at: string;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  completed_today: boolean;
  category?: string | null;
  total_completions?: number;
}

export interface HabitDashboard {
  habits_today: Habit[];
  total_due: number;
  completed_count: number;
}

export interface HabitCalendarResponse {
  completions: Record<string, string[]>; // date -> habit ids
}

export interface HabitReminder {
  id: string;
  habit: string;
  habit_name?: string;
  times: number[];
  smart: boolean;
  active: boolean;
  last_sent?: string | null;
}

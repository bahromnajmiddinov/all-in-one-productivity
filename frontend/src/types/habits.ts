export interface HabitCategory {
  id: string;
  name: string;
}

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
  category?: HabitCategory | null;
  category_id?: string | null;
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

export interface HabitStack {
  id: string;
  previous: string;
  previous_name?: string;
  next: string;
  next_name?: string;
  order: number;
  gap_minutes: number;
}

export interface HabitAnalyticsItem {
  id: string;
  name: string;
  completion_rate: number;
  previous_completion_rate?: number;
  trend_change?: number;
  trend_direction?: 'up' | 'down' | 'flat';
  total_completions: number;
  due_count: number;
  current_streak: number;
  longest_streak: number;
  strength_score: number;
}

export interface HabitAnalyticsResponse {
  start: string;
  end: string;
  habits: HabitAnalyticsItem[];
}

export interface HabitCorrelationResponse {
  start: string;
  end: string;
  habits: Array<{ id: string; name: string }>;
  matrix: number[][];
}

export interface HabitChainRun {
  start: string;
  end: string;
  length: number;
}

export interface HabitChainsResponse {
  start: string;
  end: string;
  habits: Array<{ id: string; name: string; runs: HabitChainRun[] }>;
}

export interface HabitTimeOfDayHabit {
  id: string;
  name: string;
  counts: number[];
  total_completions: number;
  average_minutes?: number | null;
  best_time_minutes?: number | null;
}

export interface HabitTimeOfDayResponse {
  start: string;
  end: string;
  habits: HabitTimeOfDayHabit[];
}

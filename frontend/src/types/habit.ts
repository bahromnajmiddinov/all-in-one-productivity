export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_per_week: number;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  completion_rate: number;
  completed_today: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit: string;
  date: string;
  completed_at: string;
  notes?: string;
}

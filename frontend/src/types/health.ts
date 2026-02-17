export interface WaterSettings {
  daily_goal_ml: number;
  goal_unit: 'ml' | 'oz';
  reminder_enabled: boolean;
  reminder_interval: number;
  smart_reminders_enabled: boolean;
  weather_adjustment_enabled: boolean;
  activity_level: 'low' | 'moderate' | 'high';
  temperature_c?: number | null;
  adjusted_goal_ml: number;
}

export interface WaterContainer {
  id: string;
  name: string;
  volume_ml: number;
  is_favorite: boolean;
  created_at: string;
}

export interface WaterLog {
  id: string;
  container?: string | null;
  container_name?: string | null;
  container_volume_ml?: number | null;
  amount_ml: number;
  logged_at: string;
  date: string;
}

export interface WaterDailyStats {
  total_ml: number;
  goal_ml: number;
  percentage: number;
  remaining_ml: number;
  logs: WaterLog[];
}

export interface WaterTimelineEntry {
  hour: number;
  total_ml: number;
}

export interface WaterTrends {
  weekly_average_ml: number;
  monthly_average_ml: number;
}

export interface WaterStreaks {
  current_streak: number;
  best_streak: number;
}

export interface WaterAnalytics {
  hydration_score: number;
  days_met_goal: number;
  average_daily_ml: number;
}

export interface WaterReminder {
  interval_minutes: number;
  next_reminder_at?: string | null;
}

export interface WaterCorrelationMetric {
  coefficient: number | null;
  data_points: number;
}

export interface WaterCorrelations {
  mood: WaterCorrelationMetric;
  energy: WaterCorrelationMetric;
  productivity: WaterCorrelationMetric;
}

export interface SleepLog {
  id: string;
  bed_time: string;
  wake_time: string;
  duration_minutes: number;
  duration_hours: number;
  quality: number;
  quality_label: string;
  disruptions: number;
  notes: string;
  date: string;
}

export interface ExerciseType {
  id: string;
  name: string;
  category: string;
  color: string;
  icon?: string;
}

export interface ExerciseLog {
  id: string;
  exercise_type: string;
  exercise_type_name: string;
  exercise_type_color: string;
  date: string;
  duration_minutes: number;
  calories_burned?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  distance_km?: number;
  notes: string;
}

export interface BodyMetrics {
  id: string;
  date: string;
  weight_kg?: number;
  weight_change_kg?: number;
  body_fat_percentage?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
}

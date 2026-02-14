export interface WaterSettings {
  daily_goal_ml: number;
  reminder_enabled: boolean;
  reminder_interval: number;
}

export interface WaterLog {
  id: string;
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

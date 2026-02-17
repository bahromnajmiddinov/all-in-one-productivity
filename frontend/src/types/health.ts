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
  disruptions_count: number;
  notes: string;
  deep_sleep_minutes?: number | null;
  light_sleep_minutes?: number | null;
  rem_sleep_minutes?: number | null;
  awake_minutes?: number | null;
  sleep_score?: number | null;
  efficiency_percent?: number | null;
  efficiency_label?: string;
  mood_before_sleep?: number | null;
  mood_after_wake?: number | null;
  room_temperature?: number | null;
  noise_level?: 'quiet' | 'moderate' | 'loud';
  caffeine_hours_before?: number | null;
  alcohol_before_sleep: boolean;
  exercised_before_sleep: boolean;
  screen_time_minutes_before?: number | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface SleepDisruption {
  id: string;
  sleep_log: string;
  disruption_type: 'bathroom' | 'noise' | 'temperature' | 'stress' | 'pain' | 'dreams' | 'phone' | 'partner' | 'pets' | 'other';
  disruption_type_label: string;
  other_reason: string;
  duration_minutes: number;
  time?: string | null;
  notes: string;
  created_at: string;
}

export interface SleepNap {
  id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  duration_hours: number;
  quality?: number | null;
  feeling_after: 'refreshed' | 'groggy' | 'same' | 'tired';
  feeling_after_label: string;
  notes: string;
  date: string;
  created_at: string;
}

export interface SleepGoal {
  id: string;
  target_duration_minutes: number;
  target_duration_hours: number;
  min_duration_minutes: number;
  min_duration_hours: number;
  max_duration_minutes: number;
  max_duration_hours: number;
  target_quality: number;
  target_bed_time?: string | null;
  target_wake_time?: string | null;
  bed_time_window_minutes: number;
  wake_time_window_minutes: number;
  consistency_target_days: number;
  weekly_naps_max: number;
  max_nap_duration: number;
  created_at: string;
  updated_at: string;
}

export interface SleepStats {
  id: string;
  total_logs: number;
  current_streak: number;
  best_streak: number;
  avg_duration_7d?: number | null;
  avg_duration_7d_hours?: number | null;
  avg_duration_30d?: number | null;
  avg_duration_30d_hours?: number | null;
  avg_duration_90d?: number | null;
  avg_duration_90d_hours?: number | null;
  avg_quality_7d?: number | null;
  avg_quality_30d?: number | null;
  avg_quality_90d?: number | null;
  avg_score_7d?: number | null;
  avg_score_30d?: number | null;
  best_sleep_date?: string | null;
  best_sleep_score?: number | null;
  worst_sleep_date?: string | null;
  worst_sleep_score?: number | null;
  avg_bed_time?: string | null;
  avg_wake_time?: string | null;
  bed_time_stddev?: number | null;
  wake_time_stddev?: number | null;
  sleep_debt_minutes: number;
  sleep_debt_hours: number;
  avg_deep_sleep_pct?: number | null;
  avg_rem_sleep_pct?: number | null;
  optimal_bed_time_start?: string | null;
  optimal_bed_time_end?: string | null;
  total_naps: number;
  avg_nap_duration?: number | null;
  day_of_week_patterns: Record<string, { avg_duration: number; avg_quality: number; avg_score: number }>;
  avg_efficiency_7d?: number | null;
  avg_efficiency_30d?: number | null;
  updated_at: string;
}

export interface SleepDebt {
  id: string;
  date: string;
  debt_minutes: number;
  debt_hours: number;
  target_minutes: number;
  target_hours: number;
  actual_minutes: number;
  actual_hours: number;
  notes: string;
  created_at: string;
}

export interface SleepCorrelation {
  id: string;
  correlation_type: 'mood' | 'productivity' | 'exercise' | 'energy' | 'focus' | 'stress';
  correlation_type_label: string;
  duration_correlation?: number | null;
  quality_correlation?: number | null;
  score_correlation?: number | null;
  start_date: string;
  end_date: string;
  data_points: number;
  insights: Record<string, any>;
  computed_at: string;
}

export interface SleepInsight {
  id: string;
  insight_type: 'pattern' | 'recommendation' | 'warning' | 'achievement' | 'correlation' | 'schedule';
  insight_type_label: string;
  title: string;
  description: string;
  related_sleep_log?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_label: string;
  confidence: number;
  action_items: string[];
  is_dismissed: boolean;
  is_read: boolean;
  created_at: string;
}

export interface SleepHeatmapEntry {
  date: string;
  duration_hours: number;
  quality: number;
  sleep_score?: number | null;
}

export interface SleepTrends {
  duration: { date: string; duration_hours: number }[];
  quality: { date: string; quality: number }[];
  score: { date: string; score: number | null }[];
}

export interface SleepConsistency {
  consistency_score: number;
  schedule_compliance: number;
  days_on_schedule: number;
  total_days: number;
}

export interface SleepOptimalWindow {
  optimal_bed_time_start: string;
  optimal_bed_time_end: string;
  avg_score: number;
  data_points: number;
}

export interface SleepCorrelations {
  mood: { coefficient: number | null; data_points: number };
  energy: { coefficient: number | null; data_points: number };
  productivity: { coefficient: number | null; data_points: number };
  exercise: { coefficient: number | null; data_points: number };
}

export interface SleepDebtSummary {
  total_debt_minutes: number;
  total_surplus_minutes: number;
  net_balance_minutes: number;
  average_daily_debt: number;
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

export interface MuscleGroup {
  id: string;
  name: string;
  display_name: string;
}

export interface Equipment {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'plyometric' | 'balance' | 'functional' | 'rehabilitation';
  category_label?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  difficulty_label?: string;
  muscle_groups: string[];
  muscle_groups_detail?: MuscleGroup[];
  equipment: string[];
  equipment_detail?: Equipment[];
  is_compound: boolean;
  is_isolation: boolean;
  default_sets?: number | null;
  default_reps?: number | null;
  default_duration_seconds?: number | null;
  default_rest_seconds?: number | null;
  image_url?: string;
  video_url?: string;
  is_system: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  workout_type: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'mixed' | 'custom';
  workout_type_label?: string;
  estimated_duration_minutes?: number | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  difficulty_level_label?: string;
  is_template: boolean;
  is_favorite: boolean;
  tags: string[];
  exercise_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout: string;
  exercise: string;
  exercise_name?: string;
  exercise_category?: string;
  order: number;
  sets?: number | null;
  reps?: number | null;
  rep_range?: string;
  duration_seconds?: number | null;
  distance_m?: number | null;
  weight_kg?: number | null;
  rest_seconds: number;
  notes?: string;
}

export interface ExerciseSet {
  id: string;
  workout_log?: string | null;
  exercise?: string | null;
  exercise_name?: string;
  exercise_type?: string | null;
  set_number: number;
  reps?: number | null;
  weight_kg?: number | null;
  duration_seconds?: number | null;
  distance_m?: number | null;
  rpe?: number | null;
  heart_rate_bpm?: number | null;
  calories_burned?: number | null;
  is_warmup: boolean;
  is_dropset: boolean;
  is_failure_set: boolean;
  notes?: string;
  completed_at: string;
  volume?: number;
}

export interface WorkoutLog {
  id: string;
  workout?: string | null;
  workout_name?: string;
  name: string;
  workout_type: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'mixed' | 'custom';
  workout_type_label?: string;
  date: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  duration_hours?: number;
  intensity?: number | null;
  calories_burned?: number | null;
  heart_rate_avg_bpm?: number | null;
  heart_rate_max_bpm?: number | null;
  total_sets: number;
  total_volume_kg: number;
  total_exercises: number;
  notes?: string;
  mood_before?: number | null;
  mood_after?: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanWeek {
  id: string;
  plan: string;
  week_number: number;
  notes?: string;
}

export interface WorkoutPlanDay {
  id: string;
  week: string;
  day_of_week: number;
  day_of_week_label?: string;
  workout?: string | null;
  workout_name?: string;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  weeks: number;
  workouts_per_week: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  is_completed: boolean;
  weeks_detail?: WorkoutPlanWeek[];
  created_at: string;
  updated_at: string;
}

export interface PersonalRecord {
  id: string;
  exercise: string;
  exercise_name?: string;
  record_type: 'weight' | 'reps' | 'time' | 'distance' | 'volume';
  record_type_label?: string;
  weight_kg?: number | null;
  reps?: number | null;
  time_seconds?: number | null;
  distance_m?: number | null;
  volume_kg?: number | null;
  date: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface FitnessGoal {
  id: string;
  title: string;
  description?: string;
  goal_type: 'weight_loss' | 'weight_gain' | 'strength' | 'endurance' | 'muscle_mass' | 'body_fat' | 'distance' | 'frequency' | 'custom';
  goal_type_label?: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  status_label?: string;
  target_weight_kg?: number | null;
  target_body_fat_percentage?: number | null;
  target_distance_km?: number | null;
  target_strength_value?: string;
  start_date: string;
  target_date: string;
  current_value?: number | null;
  unit?: string;
  milestones: number[];
  is_active: boolean;
  is_achieved: boolean;
  progress_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface RestDay {
  id: string;
  date: string;
  reason: 'scheduled' | 'recovery' | 'injury' | 'illness' | 'busy' | 'travel' | 'other';
  reason_label?: string;
  other_reason?: string;
  energy_level?: number | null;
  muscle_soreness?: number | null;
  notes?: string;
  created_at: string;
}

export interface ExerciseStats {
  id: string;
  total_workouts: number;
  current_streak: number;
  best_streak: number;
  total_duration_minutes: number;
  avg_duration_30d?: number | null;
  avg_duration_30d_hours?: number | null;
  avg_duration_90d?: number | null;
  total_volume_kg: number;
  avg_volume_30d?: number | null;
  total_calories_burned: number;
  last_workout_date?: string | null;
  last_workout_days_ago?: number | null;
  exercise_counts: Record<string, number>;
  muscle_group_balance: Record<string, any>;
  updated_at: string;
}

export interface ProgressiveOverload {
  id: string;
  exercise: string;
  exercise_name?: string;
  baseline_weight_kg?: number | null;
  baseline_reps?: number | null;
  baseline_date: string;
  current_weight_kg?: number | null;
  current_reps?: number | null;
  weight_increase_kg: number;
  rep_increase: number;
  progress_percentage: number;
  is_on_track: boolean;
  updated_at: string;
}

export interface WorkoutHeatmapEntry {
  date: string;
  workout_count: number;
  total_duration: number;
  avg_intensity: number | null;
}

export interface ExerciseVolumeData {
  date: string;
  total_volume: number;
  exercise_count: number;
}

export interface MuscleGroupBalanceData {
  muscle_group: string;
  workout_count: number;
  percentage: number;
}

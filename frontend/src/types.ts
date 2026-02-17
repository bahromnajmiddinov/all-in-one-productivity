export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface TaskTagInfo {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'active' | 'completed';
  priority: number;
  due_date?: string;
  project?: string;
  project_info?: Project;
  parent?: string | null;
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  energy_level?: number | null;
  recurrence_rule?: RecurrenceRule | null;
  tags?: string[];
  tags_info?: TaskTagInfo[];
  depends_on_ids?: string[];
  subtasks?: Task[];
  order?: number;
  created_at?: string;
  completed_at?: string | null;
  is_urgent?: boolean;
  is_important?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  weekdays?: number[]; // 0=Mon, 6=Sun
}

export interface EisenhowerMatrix {
  urgent_important: Task[];
  not_urgent_important: Task[];
  urgent_not_important: Task[];
  not_urgent_not_important: Task[];
}

export interface TaskAnalytics {
  completion_rate: number;
  total_tasks: number;
  completed_count: number;
  overdue_count: number;
  estimation_accuracy: number | null;
  estimation_sample_count: number;
}

export interface TaskDistribution {
  by_project: { name: string; count: number }[];
  by_priority: { priority: number; count: number }[];
  by_status: { status: string; count: number }[];
}

export interface User {
  id: string;
  email: string;
}

// Journal Types
export interface JournalTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface JournalMood {
  id: string;
  user: string;
  mood: number;
  energy_level?: number;
  stress_level?: number;
  sleep_quality?: number;
  notes?: string;
  date: string;
  created_at: string;
}

export interface JournalPrompt {
  id: string;
  prompt_type: 'reflection' | 'gratitude' | 'goal' | 'creativity' | 'mindfulness';
  question: string;
  suggestions?: string;
  tags?: JournalTag[];
  difficulty: number;
  usage_count: number;
  is_system: boolean;
  created_at: string;
}

export interface JournalTemplate {
  id: string;
  name: string;
  template_type: 'morning' | 'evening' | 'weekly' | 'monthly' | 'gratitude' | 'goal' | 'custom';
  description: string;
  icon: string;
  color: string;
  content: string;
  prompts?: JournalPrompt[];
  default_tags?: JournalTag[];
  suggest_mood: boolean;
  usage_count: number;
  is_system: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  rendered_content?: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  tags?: JournalTag[];
  template?: JournalTemplate;
  mood?: JournalMood;
  prompt?: JournalPrompt;
  is_favorite: boolean;
  is_private: boolean;
  word_count: number;
  sentiment_score?: number;
  sentiment_label?: string;
  keywords?: string[];
}

export interface JournalStreak {
  id: string;
  user: string;
  current_streak: number;
  last_entry_date: string;
  best_streak: number;
  best_streak_start: string;
  best_streak_end: string;
  total_entries: number;
  total_word_count: number;
  streak_percentage: number;
  days_this_month: number;
}

export interface JournalStats {
  id: string;
  user: string;
  total_entries: number;
  total_word_count: number;
  avg_word_count: number;
  current_streak: number;
  longest_streak: number;
  avg_mood?: number;
  mood_distribution: Record<number, number>;
  most_used_tags: Array<{ name: string; count: number; color: string }>;
  entries_this_week: number;
  entries_this_month: number;
  entries_this_year: number;
  most_productive_day: string;
  avg_entries_per_week: number;
  consistency_score: number;
  mood_trend: 'improving' | 'declining' | 'stable';
  writing_velocity: 'increasing' | 'decreasing' | 'stable';
  updated_at: string;
}

export interface JournalReminder {
  id: string;
  user: string;
  entry: JournalEntry;
  reminder_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_reminder_date: string;
  highlight_excerpt?: string;
  reflection_question?: string;
  is_sent: boolean;
  is_dismissed: boolean;
  is_due: boolean;
  days_until: number;
  created_at: string;
}

// Mood Tracking Types
export interface MoodScale {
  id: string;
  name: string;
  scale_type: 'numeric' | 'emoji' | 'descriptive';
  description: string;
  min_value: number;
  max_value: number;
  scale_labels: Record<string, { label: string; emoji: string }>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodFactor {
  id: string;
  category: 'sleep' | 'exercise' | 'social' | 'work' | 'diet' | 'weather' | 'health' | 'productivity' | 'relationships' | 'finances' | 'hobbies' | 'environment' | 'other';
  category_display: string;
  name: string;
  impact: number;
  rating?: number;
  notes: string;
  created_at: string;
}

export interface Emotion {
  id: string;
  primary_emotion: string;
  primary_emotion_display: string;
  specific_emotion: string;
  intensity: 1 | 2 | 3 | 4;
  intensity_display: string;
  is_dominant: boolean;
  created_at: string;
}

export interface MoodTrigger {
  id: string;
  trigger_type: 'event' | 'person' | 'thought' | 'physical' | 'external' | 'internal';
  trigger_type_display: string;
  description: string;
  is_positive: boolean;
  related_habit?: string;
  related_task?: string;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  scale?: string;
  scale_detail?: MoodScale;
  mood_value: number;
  mood_label?: string;
  mood_emoji?: string;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';
  time_of_day_display: string;
  entry_date: string;
  entry_time: string;
  notes: string;
  weather: string;
  location: string;
  factors: MoodFactor[];
  emotions: Emotion[];
  triggers: MoodTrigger[];
  journal_link_id?: string;
  has_journal_link?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodCorrelation {
  id: string;
  correlation_type: 'sleep' | 'exercise' | 'habits' | 'productivity' | 'social' | 'work' | 'weather';
  correlation_type_display: string;
  coefficient: number;
  strength: string;
  strength_display: string;
  start_date: string;
  end_date: string;
  data_points: number;
  insights: Record<string, unknown>;
  computed_at: string;
}

export interface MoodInsight {
  id: string;
  insight_type: 'pattern' | 'suggestion' | 'warning' | 'achievement' | 'correlation' | 'prediction';
  insight_type_display: string;
  title: string;
  description: string;
  related_entry?: string;
  confidence: number;
  action_items: string[];
  is_dismissed: boolean;
  is_read: boolean;
  created_at: string;
}

export interface MoodStats {
  id: string;
  total_entries: number;
  current_streak: number;
  best_streak: number;
  avg_mood_7d?: number;
  avg_mood_30d?: number;
  avg_mood_90d?: number;
  mood_distribution: Record<string, number>;
  time_of_day_averages: Record<string, number>;
  day_of_week_averages: Record<string, number>;
  best_mood_date?: string;
  worst_mood_date?: string;
  top_emotions: Array<{ emotion: string; count: number }>;
  top_positive_factors: Array<{ category: string; impact: number }>;
  top_negative_factors: Array<{ category: string; impact: number }>;
  updated_at: string;
}

export interface MoodTimelinePoint {
  date: string;
  mood_value: number;
  rolling_avg_7d?: number;
  rolling_avg_30d?: number;
  entry_count: number;
}

export interface MoodHeatmapPoint {
  date: string;
  mood_value: number;
  color: string;
  entry_count: number;
}

export interface MoodPattern {
  pattern_type: 'weekly' | 'time_of_day' | 'monthly_trend';
  pattern_data: Record<string, unknown>;
  insight: string;
}

export interface EmotionWheelItem {
  primary_emotion: string;
  label: string;
  color: string;
  related_emotions: string[];
}

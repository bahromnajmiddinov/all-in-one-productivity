export interface Calendar {
  id: string;
  name: string;
  calendar_type: 'personal' | 'work' | 'family' | 'project' | 'custom';
  color: string;
  is_visible: boolean;
  is_default: boolean;
  order: number;
  event_count: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'event' | 'meeting' | 'appointment' | 'deadline' | 'time_block' | 'task' | 'habit' | 'reminder' | 'pomodoro';
  time_block_type?: 'deep_work' | 'meeting' | 'break' | 'buffer' | 'focus' | 'review';
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  calendar?: string;
  calendar_name?: string;
  linked_task?: string;
  linked_task_title?: string;
  linked_habit?: string;
  linked_habit_name?: string;
  linked_pomodoro?: string;
  linked_pomodoro_id?: string;
  location?: string;
  attendees?: string[];
  meeting_link?: string;
  priority: number;
  is_recurring: boolean;
  recurrence_pattern?: any;
  status: 'confirmed' | 'tentative' | 'cancelled';
  has_conflict: boolean;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarPreferences {
  default_view: CalendarView;
  first_day_of_week: number;
  show_completed_tasks: boolean;
  show_habits: boolean;
  show_pomodoro: boolean;
  hour_start: number;
  hour_end: number;
  active_calendars: string[];
  active_event_types: string[];
}

export type CalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda';

export interface ScheduleAnalytics {
  period_start: string;
  period_end: string;
  total_events: number;
  total_hours: number;
  hours_by_event_type: Record<string, number>;
  hours_by_calendar: Record<string, number>;
  average_meeting_duration: number;
  meeting_count: number;
  time_block_hours: number;
  free_time_hours: number;
  busiest_day: string;
  busiest_day_hours: number;
}

export interface HeatmapData {
  date: string;
  total_hours: number;
  event_count: number;
  event_types: Record<string, number>;
  intensity: number;
}

export interface FreeTimeBlock {
  start: string;
  end: string;
  duration_minutes: number;
  is_work_hours: boolean;
}

export interface MeetingLoad {
  period: string;
  period_start: string;
  period_end: string;
  total_meeting_hours: number;
  meeting_count: number;
  average_daily_meeting_hours: number;
  peak_day: string;
  peak_day_hours: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  by_day: Array<{
    date: string;
    meeting_count: number;
    hours: number;
  }>;
}

export interface ConflictCheck {
  conflicts: CalendarEvent[];
  has_conflict: boolean;
}

export interface IntegratedView {
  events: CalendarEvent[];
  tasks: Array<{
    id: string;
    title: string;
    due_date: string;
    status: string;
    priority: number;
    project?: string;
    type: 'task';
  }>;
  habits: Array<{
    id: string;
    name: string;
    frequency: string;
    type: 'habit';
  }>;
  pomodoro_sessions: Array<{
    id: string;
    date: string;
    duration: number;
    task?: string;
    type: 'pomodoro';
  }>;
}

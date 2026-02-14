export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'event' | 'task' | 'habit' | 'reminder';
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  linked_task?: string;
  linked_task_title?: string;
  is_recurring: boolean;
  duration_minutes?: number;
}

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';
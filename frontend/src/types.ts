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

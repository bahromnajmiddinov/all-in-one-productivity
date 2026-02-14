export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'active' | 'completed';
  priority: number;
  due_date?: string;
  project?: string;
  project_info?: { id: string; name: string; color: string };
  completed_at?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
}

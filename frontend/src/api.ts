import axios from 'axios';
import type { CalendarEvent } from './types/calendar';
import type { Note, NoteFolder, NoteTag, NoteChecklistItem } from './types/notes';
import type {
  WaterSettings,
  SleepLog,
  ExerciseType,
  ExerciseLog,
  BodyMetrics,
} from './types/health';
import type { Habit } from './types/habits';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  register: (data: unknown) => api.post('/auth/register/', data),
};

export const taskApi = {
  getToday: () => api.get('/tasks/today/'),
  getOverdue: () => api.get('/tasks/overdue/'),
  getUpcoming: () => api.get('/tasks/upcoming/'),
  getTasks: (params?: Record<string, string | number>) => api.get('/tasks/', { params }),
  getTask: (id: string) => api.get(`/tasks/${id}/`),
  createTask: (data: unknown) => api.post('/tasks/', data),
  updateTask: (id: string, data: unknown) => api.patch(`/tasks/${id}/`, data),
  completeTask: (id: string) => api.post(`/tasks/${id}/complete/`),
  getEisenhower: () => api.get('/tasks/eisenhower/'),
  getAnalytics: (days?: number) => api.get('/tasks/analytics/', { params: days != null ? { days } : {} }),
  getDistribution: () => api.get('/tasks/distribution/'),
  getHeatmap: (days?: number) => api.get('/tasks/heatmap/', { params: days != null ? { days } : {} }),
  getTimeLogged: (id: string) => api.get(`/tasks/${id}/time_logged/`),
  skipRecurrence: (id: string) => api.post(`/tasks/${id}/skip_recurrence/`),
  rescheduleRecurrence: (id: string, due_date: string) =>
    api.post(`/tasks/${id}/reschedule_recurrence/`, { due_date }),
};

export const projectApi = {
  getProjects: () => api.get('/projects/'),
  createProject: (data: unknown) => api.post('/projects/', data),
};

export const pomodoroApi = {
  // Settings
  getSettings: () => api.get('/pomodoro/settings/'),
  updateSettings: (data: unknown) => api.put('/pomodoro/settings/', data),
  
  // Sessions
  getSessions: (params?: { 
    start_date?: string; 
    end_date?: string; 
    session_type?: string;
    task?: string;
    project?: string;
    completed?: boolean;
  }) => api.get('/pomodoro/sessions/', { params }),
  createSession: (data: unknown) => api.post('/pomodoro/sessions/', data),
  updateSession: (id: string, data: unknown) => api.patch(`/pomodoro/sessions/${id}/`, data),
  completeSession: (id: string) => api.post(`/pomodoro/sessions/${id}/complete/`),
  interruptSession: (id: string, data: { distraction_type: string; description?: string }) => 
    api.post(`/pomodoro/sessions/${id}/interrupt/`, data),
  resumeSession: (id: string, data?: { recovery_time_seconds?: number }) => 
    api.post(`/pomodoro/sessions/${id}/resume/`, data),
  getTodaySessions: () => api.get('/pomodoro/sessions/today/'),
  getSessionHistory: (params?: Record<string, string | boolean>) => 
    api.get('/pomodoro/sessions/history/', { params }),
  
  // Stats & Analytics
  getStats: () => api.get('/pomodoro/sessions/stats/'),
  getTimeOfDayAnalytics: (days?: number) => 
    api.get('/pomodoro/sessions/time_of_day/', { params: days ? { days } : {} }),
  getDailyAnalytics: (days?: number) => 
    api.get('/pomodoro/sessions/daily_analytics/', { params: days ? { days } : {} }),
  getProjectAnalytics: (days?: number) => 
    api.get('/pomodoro/sessions/project_analytics/', { params: days ? { days } : {} }),
  getProductivityScore: (period?: 'week' | 'month') => 
    api.get('/pomodoro/sessions/productivity_score/', { params: period ? { period } : {} }),
  
  // Distractions
  getDistractions: () => api.get('/pomodoro/distractions/'),
  logDistraction: (data: unknown) => api.post('/pomodoro/distractions/', data),
  getDistractionSummary: () => api.get('/pomodoro/distractions/summary/'),
  
  // Focus Streaks
  getFocusStreak: () => api.get('/pomodoro/streak/'),
  
  // Deep Work Sessions
  getDeepWorkSessions: () => api.get('/pomodoro/deep-work/'),
  createDeepWorkSession: (data: unknown) => api.post('/pomodoro/deep-work/', data),
  completeDeepWorkSession: (id: string, data?: { productivity_score?: number; notes?: string }) => 
    api.post(`/pomodoro/deep-work/${id}/complete/`, data),
  addPomodoroToDeepWork: (id: string, pomodoroId: string) => 
    api.post(`/pomodoro/deep-work/${id}/add_pomodoro/`, { pomodoro_id: pomodoroId }),
  getDeepWorkStats: () => api.get('/pomodoro/deep-work/stats/'),
};

export const calendarApi = {
  getEvents: (params?: { start?: string; end?: string }) => 
    api.get('/calendar/events/', { params }),
  createEvent: (data: Partial<CalendarEvent>) => api.post('/calendar/events/', data),
  updateEvent: (id: string, data: Partial<CalendarEvent>) => 
    api.put(`/calendar/events/${id}/`, data),
  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}/`),
  getDayEvents: (date: string) => api.get('/calendar/events/day/', { params: { date } }),
  getTodayEvents: () => api.get('/calendar/events/today/'),
  getPreferences: () => api.get('/calendar/preferences/'),
  updatePreferences: (data: any) => api.put('/calendar/preferences/', data),
};

export const notesApi = {
  // Folders
  getFolders: () => api.get('/notes/folders/'),
  getFolderTree: () => api.get('/notes/folders/tree/'),
  createFolder: (data: Partial<NoteFolder>) => api.post('/notes/folders/', data),
  updateFolder: (id: string, data: Partial<NoteFolder>) => api.put(`/notes/folders/${id}/`, data),
  deleteFolder: (id: string) => api.delete(`/notes/folders/${id}/`),
  
  // Tags
  getTags: () => api.get('/notes/tags/'),
  createTag: (data: Partial<NoteTag>) => api.post('/notes/tags/', data),
  updateTag: (id: string, data: Partial<NoteTag>) => api.put(`/notes/tags/${id}/`, data),
  deleteTag: (id: string) => api.delete(`/notes/tags/${id}/`),
  
  // Notes
  getNotes: (params?: { folder?: string; tag?: string; favorites?: boolean; search?: string }) => 
    api.get('/notes/', { params }),
  getNote: (id: string) => api.get(`/notes/${id}/`),
  createNote: (data: Partial<Note>) => api.post('/notes/', data),
  updateNote: (id: string, data: Partial<Note>) => api.put(`/notes/${id}/`, data),
  deleteNote: (id: string) => api.delete(`/notes/${id}/`),
  
  // Note actions
  pinNote: (id: string) => api.post(`/notes/${id}/pin/`),
  favoriteNote: (id: string) => api.post(`/notes/${id}/favorite/`),
  archiveNote: (id: string) => api.post(`/notes/${id}/archive/`),
  restoreNote: (id: string) => api.post(`/notes/${id}/restore/`),
  getArchivedNotes: () => api.get('/notes/archived/'),
  
  // Checklist
  addChecklistItem: (noteId: string, content: string) => 
    api.post('/notes/checklist-items/', { note: noteId, content }),
  updateChecklistItem: (id: string, data: Partial<NoteChecklistItem>) => 
    api.put(`/notes/checklist-items/${id}/`, data),
  deleteChecklistItem: (id: string) => api.delete(`/notes/checklist-items/${id}/`),
};

export const habitApi = {
  getHabits: () => api.get<Habit[]>('/habits/'),
  getHabit: (id: string) => api.get<Habit>(`/habits/${id}/`),
  createHabit: (data: Partial<Habit>) => api.post('/habits/', data),
  updateHabit: (id: string, data: Partial<Habit>) => api.put(`/habits/${id}/`, data),
  deleteHabit: (id: string) => api.delete(`/habits/${id}/`),
  getToday: () => api.get('/habits/today/'),
  getDashboard: () => api.get('/habits/dashboard/'),
  getCalendar: (year: number, month: number) =>
    api.get('/habits/calendar/', { params: { year, month } }),
  toggle: (id: string, date?: string) =>
    api.post(`/habits/${id}/toggle/`, date ? { date } : {}),
  complete: (id: string, date?: string) =>
    api.post(`/habits/${id}/complete/`, date ? { date } : {}),
  // Reminders and stacks
  getReminders: () => api.get('/reminders/'),
  createReminder: (data: any) => api.post('/reminders/', data),
  updateReminder: (id: string, data: any) => api.put(`/reminders/${id}/`, data),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}/`),
  suggestReminderTime: (id: string) => api.get(`/reminders/${id}/suggest_time/`),
};

export const healthApi = {
  // Water
  getWaterSettings: () => api.get('/health/water/settings/'),
  updateWaterSettings: (data: Partial<WaterSettings>) => api.put('/health/water/settings/', data),
  getWaterLogs: () => api.get('/health/water/logs/'),
  addWaterLog: (amount_ml: number) => api.post('/health/water/logs/', { amount_ml }),
  getWaterToday: () => api.get('/health/water/logs/today/'),
  getWaterStats: () => api.get('/health/water/logs/stats/'),

  // Sleep
  getSleepLogs: () => api.get('/health/sleep/'),
  createSleepLog: (data: Partial<SleepLog>) => api.post('/health/sleep/', data),
  getSleepStats: () => api.get('/health/sleep/stats/'),

  // Exercise
  getExerciseTypes: () => api.get('/health/exercise/types/'),
  createExerciseType: (data: Partial<ExerciseType>) => api.post('/health/exercise/types/', data),
  getExerciseLogs: () => api.get('/health/exercise/logs/'),
  createExerciseLog: (data: Partial<ExerciseLog>) => api.post('/health/exercise/logs/', data),
  getExerciseStats: () => api.get('/health/exercise/logs/stats/'),

  // Body Metrics
  getBodyMetrics: () => api.get('/health/body-metrics/'),
  createBodyMetric: (data: Partial<BodyMetrics>) => api.post('/health/body-metrics/', data),
};

export const financeApi = {
  // Accounts
  getAccounts: () => api.get('/finance/accounts/'),
  createAccount: (data: unknown) => api.post('/finance/accounts/', data),
  updateAccount: (id: string, data: unknown) => api.patch(`/finance/accounts/${id}/`, data),
  deleteAccount: (id: string) => api.delete(`/finance/accounts/${id}/`),

  // Categories
  getCategories: () => api.get('/finance/categories/'),
  createCategory: (data: unknown) => api.post('/finance/categories/', data),

  // Transactions
  getTransactions: (params?: Record<string, string | number>) => api.get('/finance/transactions/', { params }),
  createTransaction: (data: unknown) => api.post('/finance/transactions/', data),

  // Budgets & Goals
  getBudgets: () => api.get('/finance/budgets/'),
  getGoals: () => api.get('/finance/goals/'),

  // Recurring
  getRecurring: () => api.get('/finance/recurring/'),
  runRecurringNow: () => api.post('/finance/recurring/run_due/'),
};

export default api;

import axios from 'axios';
import type { CalendarEvent } from './types/calendar';
import type { Note, NoteFolder, NoteTag, NoteChecklistItem, NoteAttachment, NoteTemplate, WebClipData } from './types/notes';
import type {
  WaterSettings,
  WaterContainer,
  SleepLog,
  ExerciseType,
  ExerciseLog,
  BodyMetrics,
} from './types/health';
import type { Habit } from './types/habits';
import type {
  JournalTag,
  JournalMood,
  JournalPrompt,
  JournalTemplate,
  JournalEntry,
  JournalStreak,
  JournalStats,
  JournalReminder,
} from './types';

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
  // Calendars
  getCalendars: () => api.get('/calendar/'),
  getCalendar: (id: string) => api.get(`/calendar/${id}/`),
  createCalendar: (data: any) => api.post('/calendar/', data),
  updateCalendar: (id: string, data: any) => api.put(`/calendar/${id}/`, data),
  deleteCalendar: (id: string) => api.delete(`/calendar/${id}/`),
  
  // Events
  getEvents: (params?: { start?: string; end?: string; calendar?: string; event_type?: string; status?: string }) => 
    api.get('/calendar/events/', { params }),
  getEvent: (id: string) => api.get(`/calendar/events/${id}/`),
  createEvent: (data: Partial<CalendarEvent>) => api.post('/calendar/events/', data),
  updateEvent: (id: string, data: Partial<CalendarEvent>) => 
    api.put(`/calendar/events/${id}/`, data),
  partialUpdateEvent: (id: string, data: Partial<CalendarEvent>) => 
    api.patch(`/calendar/events/${id}/`, data),
  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}/`),
  getDayEvents: (date: string) => api.get('/calendar/events/day/', { params: { date } }),
  getTodayEvents: () => api.get('/calendar/events/today/'),
  getUpcomingEvents: (limit?: number) => api.get('/calendar/events/upcoming/', { params: { limit } }),
  getEventsRange: (start: string, end: string) => api.get('/calendar/events/range/', { params: { start, end } }),
  
  // Analytics
  checkConflicts: (params: { start_date: string; start_time: string; end_time: string; end_date?: string; exclude_id?: string }) =>
    api.get('/calendar/events/check_conflicts/', { params }),
  getAnalytics: (params?: { start?: string; end?: string }) =>
    api.get('/calendar/events/analytics/', { params }),
  getHeatmap: (params?: { start?: string; end?: string }) =>
    api.get('/calendar/events/heatmap/', { params }),
  getFreeTime: (params?: { start?: string; end?: string; work_start?: number; work_end?: number }) =>
    api.get('/calendar/events/free_time/', { params }),
  getMeetingLoad: (period?: 'week' | 'month' | 'quarter') =>
    api.get('/calendar/events/meeting_load/', { params: { period } }),
  
  // Integration
  getIntegrationView: (params?: { start?: string; end?: string }) =>
    api.get('/calendar/events/integration/', { params }),
  
  // Preferences
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
  getPopularTags: () => api.get('/notes/tags/popular/'),
  createTag: (data: Partial<NoteTag>) => api.post('/notes/tags/', data),
  updateTag: (id: string, data: Partial<NoteTag>) => api.put(`/notes/tags/${id}/`, data),
  deleteTag: (id: string) => api.delete(`/notes/tags/${id}/`),

  // Notes
  getNotes: (params?: { folder?: string; tag?: string; favorites?: boolean; pinned?: boolean; search?: string; note_type?: string; date_from?: string; date_to?: string; archived?: string }) =>
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

  // Links (bidirectional/Zettelkasten)
  addLink: (id: string, targetNoteId: string, linkText?: string) =>
    api.post(`/notes/${id}/add_link/`, { target_note_id: targetNoteId, link_text: linkText }),
  removeLink: (id: string, targetNoteId: string) =>
    api.post(`/notes/${id}/remove_link/`, { target_note_id: targetNoteId }),
  getBacklinks: (id: string) => api.get(`/notes/${id}/backlinks/`),

  // Attachments
  getAttachments: (params?: { note?: string }) => api.get('/notes/attachments/', { params }),
  createAttachment: (data: FormData) => api.post('/notes/attachments/', data),
  updateAttachment: (id: string, data: Partial<NoteAttachment>) => api.put(`/notes/attachments/${id}/`, data),
  deleteAttachment: (id: string) => api.delete(`/notes/attachments/${id}/`),

  // Checklist
  addChecklistItem: (noteId: string, content: string) =>
    api.post('/notes/checklist-items/', { note: noteId, content }),
  updateChecklistItem: (id: string, data: Partial<NoteChecklistItem>) =>
    api.put(`/notes/checklist-items/${id}/`, data),
  deleteChecklistItem: (id: string) => api.delete(`/notes/checklist-items/${id}/`),

  // Templates
  getTemplates: () => api.get('/notes/templates/'),
  getDefaultTemplates: () => api.get('/notes/templates/defaults/'),
  createTemplate: (data: Partial<NoteTemplate>) => api.post('/notes/templates/', data),
  updateTemplate: (id: string, data: Partial<NoteTemplate>) => api.put(`/notes/templates/${id}/`, data),
  deleteTemplate: (id: string) => api.delete(`/notes/templates/${id}/`),
  useTemplate: (id: string) => api.post(`/notes/templates/${id}/use/`),

  // Quick Capture
  quickCapture: (data: { capture_type: string; content: string; title?: string; folder?: string; tags?: string[]; auto_convert?: boolean }) =>
    api.post('/notes/quick_capture/', data),
  getQuickCaptures: () => api.get('/notes/quick-captures/'),
  convertQuickCapture: (id: string) => api.post(`/notes/quick-captures/${id}/convert/`),
  deleteQuickCapture: (id: string) => api.delete(`/notes/quick-captures/${id}/`),

  // Web Clip
  webClip: (data: WebClipData) =>
    api.post('/notes/web_clip/', data),

  // Knowledge Graph
  getGraphData: () => api.get('/notes/graph/'),

  // Analytics
  getAnalytics: () => api.get('/notes/analytics/'),
  getNoteAnalytics: (id: string) => api.get(`/notes/analytics/${id}/`),

  // Search
  search: (params: { q: string; folder?: string; tag?: string; note_type?: string; date_from?: string; date_to?: string }) =>
    api.get('/notes/search/', { params }),
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
  getAnalytics: (days?: number) => api.get('/habits/analytics/', { params: days ? { days } : {} }),
  getCorrelations: (days?: number) => api.get('/habits/correlations/', { params: days ? { days } : {} }),
  getChains: (days?: number) => api.get('/habits/chains/', { params: days ? { days } : {} }),
  getTimeOfDay: (days?: number) => api.get('/habits/time_of_day/', { params: days ? { days } : {} }),
  toggle: (id: string, date?: string) =>
    api.post(`/habits/${id}/toggle/`, date ? { date } : {}),
  complete: (id: string, date?: string) =>
    api.post(`/habits/${id}/complete/`, date ? { date } : {}),
  // Categories
  getCategories: () => api.get('/categories/'),
  createCategory: (data: { name: string }) => api.post('/categories/', data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}/`),
  // Reminders
  getReminders: () => api.get('/reminders/'),
  createReminder: (data: any) => api.post('/reminders/', data),
  updateReminder: (id: string, data: any) => api.put(`/reminders/${id}/`, data),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}/`),
  suggestReminderTime: (id: string) => api.get(`/reminders/${id}/suggest_time/`),
  // Stacks
  getStacks: () => api.get('/stacks/'),
  createStack: (data: any) => api.post('/stacks/', data),
  deleteStack: (id: string) => api.delete(`/stacks/${id}/`),
};

export const healthApi = {
  // Water
  getWaterSettings: () => api.get('/health/water/settings/'),
  updateWaterSettings: (data: Partial<WaterSettings>) => api.put('/health/water/settings/', data),
  getWaterLogs: () => api.get('/health/water/logs/'),
  addWaterLog: (amount_ml: number, container?: string | null) =>
    api.post('/health/water/logs/', { amount_ml, container }),
  getWaterToday: () => api.get('/health/water/logs/today/'),
  getWaterStats: () => api.get('/health/water/logs/stats/'),
  getWaterTimeline: () => api.get('/health/water/logs/timeline/'),
  getWaterTrends: () => api.get('/health/water/logs/trends/'),
  getWaterStreaks: () => api.get('/health/water/logs/streaks/'),
  getWaterAnalytics: () => api.get('/health/water/logs/analytics/'),
  getWaterReminder: () => api.get('/health/water/logs/reminders/'),
  getWaterCorrelations: () => api.get('/health/water/logs/correlations/'),
  getWaterContainers: () => api.get<WaterContainer[]>('/health/water/containers/'),
  createWaterContainer: (data: Partial<WaterContainer>) => api.post('/health/water/containers/', data),
  updateWaterContainer: (id: string, data: Partial<WaterContainer>) =>
    api.put(`/health/water/containers/${id}/`, data),
  deleteWaterContainer: (id: string) => api.delete(`/health/water/containers/${id}/`),

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
  deleteCategory: (id: string) => api.delete(`/finance/categories/${id}/`),

  // Transactions
  getTransactions: (params?: Record<string, string | number>) => api.get('/finance/transactions/', { params }),
  createTransaction: (data: unknown) => api.post('/finance/transactions/', data),
  deleteTransaction: (id: string) => api.delete(`/finance/transactions/${id}/`),

  // Budgets & Goals
  getBudgets: () => api.get('/finance/budgets/'),
  createBudget: (data: unknown) => api.post('/finance/budgets/', data),
  updateBudget: (id: string, data: unknown) => api.patch(`/finance/budgets/${id}/`, data),
  getGoals: () => api.get('/finance/goals/'),
  createGoal: (data: unknown) => api.post('/finance/goals/', data),
  updateGoal: (id: string, data: unknown) => api.patch(`/finance/goals/${id}/`, data),

  // Income sources
  getIncomeSources: () => api.get('/finance/income-sources/'),
  createIncomeSource: (data: unknown) => api.post('/finance/income-sources/', data),
  deleteIncomeSource: (id: string) => api.delete(`/finance/income-sources/${id}/`),

  // Investments
  getInvestments: () => api.get('/finance/investments/'),
  createInvestment: (data: unknown) => api.post('/finance/investments/', data),
  updateInvestment: (id: string, data: unknown) => api.patch(`/finance/investments/${id}/`, data),
  deleteInvestment: (id: string) => api.delete(`/finance/investments/${id}/`),

  // Net worth
  getNetWorthSnapshots: () => api.get('/finance/net-worth/'),
  createNetWorthSnapshot: (data: unknown) => api.post('/finance/net-worth/', data),

  // Analytics
  getSpendingTrends: (params?: Record<string, string | number>) =>
    api.get('/finance/analytics/spending_trends/', { params }),
  getCashFlow: (params?: Record<string, string | number>) =>
    api.get('/finance/analytics/cash_flow/', { params }),
  getBudgetVsActual: () => api.get('/finance/analytics/budget_vs_actual/'),
  getNetWorthSummary: (params?: Record<string, string | number>) =>
    api.get('/finance/analytics/net_worth/', { params }),
  getHealthScore: (params?: Record<string, string | number>) =>
    api.get('/finance/analytics/health_score/', { params }),
  getCategoryHeatmap: (params?: Record<string, string | number>) =>
    api.get('/finance/analytics/category_heatmap/', { params }),
  getMonthComparison: () => api.get('/finance/analytics/month_over_month/'),
  getInvestmentPerformance: () => api.get('/finance/analytics/investment_performance/'),
  getIncomeStreamTotals: () => api.get('/finance/analytics/income_streams/'),

  // Recurring
  getRecurring: () => api.get('/finance/recurring/'),
  createRecurring: (data: unknown) => api.post('/finance/recurring/', data),
  deleteRecurring: (id: string) => api.delete(`/finance/recurring/${id}/`),
  runRecurringNow: () => api.post('/finance/recurring/run_due/'),
};

export const journalApi = {
  // Tags
  getTags: () => api.get('/journal/tags/'),
  getPopularTags: () => api.get('/journal/tags/popular/'),
  createTag: (data: Partial<{ name: string; color: string; icon: string }>) =>
    api.post('/journal/tags/', data),
  updateTag: (id: string, data: Partial<{ name: string; color: string; icon: string }>) =>
    api.put(`/journal/tags/${id}/`, data),
  deleteTag: (id: string) => api.delete(`/journal/tags/${id}/`),

  // Moods
  getMoods: (params?: { start_date?: string; end_date?: string }) => api.get('/journal/moods/', { params }),
  getMood: (id: string) => api.get(`/journal/moods/${id}/`),
  createMood: (data: Partial<{
    mood: number;
    energy_level?: number;
    stress_level?: number;
    sleep_quality?: number;
    notes?: string;
    date?: string;
  }>) => api.post('/journal/moods/', data),
  updateMood: (id: string, data: Partial<{
    mood: number;
    energy_level?: number;
    stress_level?: number;
    sleep_quality?: number;
    notes?: string;
  }>) => api.put(`/journal/moods/${id}/`, data),
  deleteMood: (id: string) => api.delete(`/journal/moods/${id}/`),
  getRecentMoods: (days?: number) => api.get('/journal/moods/recent/', { params: days ? { days } : {} }),
  getMoodTrends: (days?: number) => api.get('/journal/moods/trends/', { params: days ? { days } : {} }),
  getMoodDistribution: () => api.get('/journal/moods/distribution/'),

  // Prompts
  getPrompts: (params?: { type?: string; ordering?: string }) =>
    api.get('/journal/prompts/', { params }),
  getPrompt: (id: string) => api.get(`/journal/prompts/${id}/`),
  createPrompt: (data: Partial<{
    prompt_type: string;
    question: string;
    suggestions?: string;
    tags?: string[];
    difficulty?: number;
  }>) => api.post('/journal/prompts/', data),
  updatePrompt: (id: string, data: Partial<{
    prompt_type: string;
    question: string;
    suggestions?: string;
    tags?: string[];
    difficulty?: number;
  }>) => api.put(`/journal/prompts/${id}/`, data),
  deletePrompt: (id: string) => api.delete(`/journal/prompts/${id}/`),
  getRandomPrompt: (type?: string) => api.get('/journal/prompts/random/', { params: type ? { type } : {} }),
  getDailyPrompt: () => api.get('/journal/prompts/daily/'),
  getPromptsByType: () => api.get('/journal/prompts/by_type/'),

  // Templates
  getTemplates: () => api.get('/journal/templates/'),
  getTemplate: (id: string) => api.get(`/journal/templates/${id}/`),
  createTemplate: (data: Partial<{
    name: string;
    template_type: string;
    description?: string;
    icon?: string;
    color?: string;
    content: string;
    prompts?: string[];
    default_tags?: string[];
    suggest_mood?: boolean;
  }>) => api.post('/journal/templates/', data),
  updateTemplate: (id: string, data: Partial<{
    name: string;
    template_type: string;
    description?: string;
    icon?: string;
    color?: string;
    content: string;
    prompts?: string[];
    default_tags?: string[];
    suggest_mood?: boolean;
  }>) => api.put(`/journal/templates/${id}/`, data),
  deleteTemplate: (id: string) => api.delete(`/journal/templates/${id}/`),
  getSystemTemplates: () => api.get('/journal/templates/system/'),
  useTemplate: (id: string) => api.post(`/journal/templates/${id}/use/`),

  // Entries
  getEntries: (params?: {
    favorites?: boolean;
    start_date?: string;
    end_date?: string;
    tag?: string;
    template?: string;
    min_mood?: string;
    max_mood?: string;
    sentiment?: string;
    min_words?: string;
    max_words?: string;
    search?: string;
    ordering?: string;
  }) => api.get('/journal/entries/', { params }),
  getEntry: (id: string) => api.get(`/journal/entries/${id}/`),
  createEntry: (data: Partial<{
    title?: string;
    content: string;
    entry_date?: string;
    tags?: string[];
    template?: string;
    prompt?: string;
    mood?: string;
    is_favorite?: boolean;
    is_private?: boolean;
  }>) => api.post('/journal/entries/', data),
  updateEntry: (id: string, data: Partial<{
    title?: string;
    content: string;
    entry_date?: string;
    tags?: string[];
    template?: string;
    prompt?: string;
    mood?: string;
    is_favorite?: boolean;
    is_private?: boolean;
  }>) => api.put(`/journal/entries/${id}/`, data),
  partialUpdateEntry: (id: string, data: Partial<{
    title?: string;
    content: string;
    entry_date?: string;
    tags?: string[];
    template?: string;
    prompt?: string;
    mood?: string;
    is_favorite?: boolean;
    is_private?: boolean;
  }>) => api.patch(`/journal/entries/${id}/`, data),
  deleteEntry: (id: string) => api.delete(`/journal/entries/${id}/`),

  // Entry actions
  favoriteEntry: (id: string) => api.post(`/journal/entries/${id}/favorite/`),

  // Timeline & Calendar
  getTimeline: (params?: {
    start_date?: string;
    end_date?: string;
    tag?: string;
    favorites?: boolean;
  }) => api.get('/journal/entries/timeline/', { params }),
  getCalendar: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/journal/entries/calendar/', { params }),
  getByDate: (date: string) => api.get('/journal/entries/by_date/', { params: { date } }),

  // Search
  searchEntries: (params: {
    q?: string;
    tags?: string[];
    start_date?: string;
    end_date?: string;
    min_sentiment?: string;
    max_sentiment?: string;
    min_words?: string;
    max_words?: string;
  }) => api.get('/journal/entries/search/', { params }),

  // Special views
  getFavorites: () => api.get('/journal/entries/favorites/'),
  getMemoryLane: (params?: { days_ago?: number; count?: number }) =>
    api.get('/journal/entries/memory_lane/', { params }),
  getWordCountTrends: (days?: number) => api.get('/journal/entries/word_count_trends/', { params: days ? { days } : {} }),
  getSentimentOverview: () => api.get('/journal/entries/sentiment_overview/'),

  // Analytics
  getAnalytics: () => api.get('/journal/analytics/'),
  getEntryAnalytics: (id: string) => api.get(`/journal/analytics/${id}/`),

  // Streaks
  getStreaks: () => api.get('/journal/streaks/'),
  getMyStreak: () => api.get('/journal/streaks/mine/'),
  getStreakHeatmap: () => api.get('/journal/streaks/calendar_heatmap/'),

  // Reminders
  getReminders: () => api.get('/journal/reminders/'),
  getReminder: (id: string) => api.get(`/journal/reminders/${id}/`),
  createReminder: (data: Partial<{
    entry: string;
    reminder_type: string;
    next_reminder_date: string;
    highlight_excerpt?: string;
    reflection_question?: string;
  }>) => api.post('/journal/reminders/', data),
  updateReminder: (id: string, data: Partial<{
    entry: string;
    reminder_type: string;
    next_reminder_date: string;
    highlight_excerpt?: string;
    reflection_question?: string;
  }>) => api.put(`/journal/reminders/${id}/`, data),
  deleteReminder: (id: string) => api.delete(`/journal/reminders/${id}/`),
  getUpcomingReminders: () => api.get('/journal/reminders/upcoming/'),
  getDueReminders: () => api.get('/journal/reminders/due/'),
  dismissReminder: (id: string) => api.post(`/journal/reminders/${id}/dismiss/`),
  processDueReminders: () => api.post('/journal/reminders/process_due/'),

  // Stats
  getStats: () => api.get('/journal/stats/'),
  getStatsDashboard: () => api.get('/journal/stats/dashboard/'),
  getConsistency: (days?: number) => api.get('/journal/stats/consistency/', { params: days ? { days } : {} }),
  getMoodOverTime: (days?: number) => api.get('/journal/stats/mood_over_time/', { params: days ? { days } : {} }),
  getWritingPatterns: () => api.get('/journal/stats/writing_patterns/'),
};

export const moodApi = {
  // Scales
  getScales: () => api.get('/mood/scales/'),
  getScale: (id: string) => api.get(`/mood/scales/${id}/`),
  createScale: (data: unknown) => api.post('/mood/scales/', data),
  updateScale: (id: string, data: unknown) => api.put(`/mood/scales/${id}/`, data),
  deleteScale: (id: string) => api.delete(`/mood/scales/${id}/`),
  setDefaultScale: (id: string) => api.post(`/mood/scales/${id}/set_default/`),

  // Entries
  getEntries: (params?: {
    start_date?: string;
    end_date?: string;
    time_of_day?: string;
    min_mood?: number;
    max_mood?: number;
  }) => api.get('/mood/entries/', { params }),
  getEntry: (id: string) => api.get(`/mood/entries/${id}/`),
  createEntry: (data: unknown) => api.post('/mood/entries/', data),
  updateEntry: (id: string, data: unknown) => api.put(`/mood/entries/${id}/`, data),
  deleteEntry: (id: string) => api.delete(`/mood/entries/${id}/`),
  quickLog: (data: { mood_value: number; time_of_day: string; notes?: string }) =>
    api.post('/mood/entries/quick_log/', data),
  getTodayEntries: () => api.get('/mood/entries/today/'),

  // Timeline & Analytics
  getTimeline: (days?: number) => api.get('/mood/entries/timeline/', { params: days ? { days } : {} }),
  getHeatmap: (year?: number) => api.get('/mood/entries/heatmap/', { params: year ? { year } : {} }),
  getPatterns: (days?: number) => api.get('/mood/entries/patterns/', { params: days ? { days } : {} }),
  getCompare: (metric: string, days?: number) =>
    api.get('/mood/entries/compare/', { params: { metric, ...(days ? { days } : {}) } }),
  getEmotionDistribution: (days?: number) =>
    api.get('/mood/entries/emotion_distribution/', { params: days ? { days } : {} }),

  // Factors
  getFactors: () => api.get('/mood/factors/'),
  createFactor: (data: unknown) => api.post('/mood/factors/', data),
  updateFactor: (id: string, data: unknown) => api.put(`/mood/factors/${id}/`, data),
  deleteFactor: (id: string) => api.delete(`/mood/factors/${id}/`),

  // Emotions
  getEmotions: () => api.get('/mood/emotions/'),
  createEmotion: (data: unknown) => api.post('/mood/emotions/', data),
  updateEmotion: (id: string, data: unknown) => api.put(`/mood/emotions/${id}/`, data),
  deleteEmotion: (id: string) => api.delete(`/mood/emotions/${id}/`),
  getEmotionWheel: () => api.get('/mood/emotions/wheel/'),

  // Triggers
  getTriggers: () => api.get('/mood/triggers/'),
  createTrigger: (data: unknown) => api.post('/mood/triggers/', data),
  updateTrigger: (id: string, data: unknown) => api.put(`/mood/triggers/${id}/`, data),
  deleteTrigger: (id: string) => api.delete(`/mood/triggers/${id}/`),
  getTriggerAnalysis: (days?: number) =>
    api.get('/mood/triggers/analysis/', { params: days ? { days } : {} }),

  // Correlations
  getCorrelations: () => api.get('/mood/correlations/'),
  computeCorrelations: (days?: number) => api.post('/mood/correlations/compute/', { days }),

  // Insights
  getInsights: () => api.get('/mood/insights/'),
  dismissInsight: (id: string) => api.post(`/mood/insights/${id}/dismiss/`),
  markInsightRead: (id: string) => api.post(`/mood/insights/${id}/mark_read/`),
  generateInsights: (days?: number) =>
    api.get('/mood/insights/generate/', { params: days ? { days } : {} }),

  // Stats
  getStats: () => api.get('/mood/stats/'),
  refreshStats: () => api.post('/mood/stats/refresh/'),

  // Journal Links
  getJournalLinks: () => api.get('/mood/journal-links/'),
  createJournalLink: (data: unknown) => api.post('/mood/journal-links/', data),
  deleteJournalLink: (id: string) => api.delete(`/mood/journal-links/${id}/`),
};

export default api;

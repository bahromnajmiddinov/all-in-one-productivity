import axios from 'axios';
import type { CalendarEvent } from './types/calendar';
import type { Note, NoteFolder, NoteTag, NoteChecklistItem } from './types/notes';

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
  getTasks: () => api.get('/tasks/'),
  createTask: (data: unknown) => api.post('/tasks/', data),
  completeTask: (id: string) => api.post(`/tasks/${id}/complete/`),
};

export const projectApi = {
  getProjects: () => api.get('/projects/'),
  createProject: (data: unknown) => api.post('/projects/', data),
};

export const pomodoroApi = {
  getSettings: () => api.get('/pomodoro/settings/'),
  updateSettings: (data: unknown) => api.put('/pomodoro/settings/', data),
  getSessions: () => api.get('/pomodoro/sessions/'),
  createSession: (data: unknown) => api.post('/pomodoro/sessions/', data),
  completeSession: (id: string) => api.post(`/pomodoro/sessions/${id}/complete/`),
  getTodaySessions: () => api.get('/pomodoro/sessions/today/'),
  getStats: () => api.get('/pomodoro/sessions/stats/'),
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

export default api;

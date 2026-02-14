import axios from 'axios';

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

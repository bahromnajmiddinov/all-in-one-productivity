import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Today } from './pages/Today';
import { Projects } from './pages/Projects';
import { Pomodoro } from './pages/Pomodoro';
import { Calendar } from './pages/Calendar';
import { Notes } from './pages/Notes';
import { NoteDetail } from './pages/NoteDetail';
import { Health } from './pages/Health';
import { Habits } from './pages/Habits';
import { Tasks } from './pages/Tasks';
import { Finance } from './pages/Finance';
import { Journal } from './pages/Journal';
import { JournalEntryDetail } from './pages/JournalEntryDetail';
import { JournalNewEntry } from './pages/JournalNewEntry';
import { JournalAnalytics } from './pages/JournalAnalytics';
import Mood from './pages/Mood';
import { Dashboard } from './pages/Dashboard';
import { CustomDashboard } from './pages/CustomDashboard';
import { DashboardComparison } from './pages/DashboardComparison';
import { DashboardCorrelations } from './pages/DashboardCorrelations';
import { Automation } from './pages/Automation';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="today" element={<Today />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/custom" element={<CustomDashboard />} />
          <Route path="dashboard/custom/:id" element={<CustomDashboard />} />
          <Route path="dashboard/comparison" element={<DashboardComparison />} />
          <Route path="dashboard/correlations" element={<DashboardCorrelations />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="projects" element={<Projects />} />
          <Route path="pomodoro" element={<Pomodoro />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/:id" element={<NoteDetail />} />
          <Route path="health" element={<Health />} />
          <Route path="habits" element={<Habits />} />
          <Route path="finance" element={<Finance />} />
          <Route path="automation" element={<Automation />} />
          <Route path="journal" element={<Journal />} />
          <Route path="journal/new" element={<JournalNewEntry />} />
          <Route path="journal/:id" element={<JournalEntryDetail />} />
          <Route path="journal/analytics" element={<JournalAnalytics />} />
          <Route path="mood" element={<Mood />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

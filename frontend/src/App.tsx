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
          <Route index element={<Navigate to="/today" />} />
          <Route path="today" element={<Today />} />
          <Route path="projects" element={<Projects />} />
          <Route path="pomodoro" element={<Pomodoro />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="notes" element={<Notes />} />
          <Route path="notes/:id" element={<NoteDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

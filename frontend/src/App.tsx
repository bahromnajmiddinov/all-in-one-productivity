import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Today } from './pages/Today';
import { Projects } from './pages/Projects';
import { Pomodoro } from './pages/Pomodoro';
import { Habits } from './pages/Habits';

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
          <Route path="habits" element={<Habits />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

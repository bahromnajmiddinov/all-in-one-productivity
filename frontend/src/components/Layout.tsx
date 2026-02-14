import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Task Manager</h1>
          <div className="flex gap-4">
            <Link to="/today" className="text-gray-600 hover:text-gray-900">
              Today
            </Link>
            <Link to="/projects" className="text-gray-600 hover:text-gray-900">
              Projects
            </Link>
            <Link to="/pomodoro" className="text-gray-600 hover:text-gray-900">
              Pomodoro
            </Link>
            <Link to="/calendar" className="text-gray-600 hover:text-gray-900">
              Calendar
            </Link>
            <Link to="/notes" className="text-gray-600 hover:text-gray-900">
              Notes
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

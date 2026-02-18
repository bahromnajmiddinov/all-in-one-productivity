import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Timer,
  Calendar,
  FileText,
  BookOpen,
  Heart,
  Target,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Sun,
  Moon,
  Smile,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/mood', label: 'Mood', icon: Smile },
  { to: '/health', label: 'Health', icon: Heart },
  { to: '/habits', label: 'Habits', icon: Target },
  { to: '/finance', label: 'Finance', icon: CreditCard },
  { to: '/automation', label: 'Automation', icon: Zap },
];

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const location = useLocation();

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode((d) => !d);
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-bg-elevated transition-smooth flex flex-col',
          sidebarCollapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]'
        )}
      >
        <div className="flex h-[var(--header-height)] items-center px-3 border-b border-border">
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Productivity
            </span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth',
                  isActive
                    ? 'bg-bg-subtle text-foreground'
                    : 'text-fg-muted hover:bg-bg-subtle hover:text-foreground'
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="flex items-center justify-center h-10 border-t border-border text-fg-muted hover:text-foreground hover:bg-bg-subtle transition-smooth"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>
      </aside>

      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-smooth',
          sidebarCollapsed ? 'pl-[var(--sidebar-collapsed)]' : 'pl-[var(--sidebar-width)]'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-4 border-b border-border bg-bg-elevated/80 backdrop-blur-sm px-6">
          <div
            className={cn(
              'flex-1 max-w-md flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 transition-smooth',
              searchFocused && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
            )}
          >
            <Search className="size-4 text-fg-muted shrink-0" strokeWidth={1.5} />
            <input
              type="search"
              placeholder="Search tasks, notes, events..."
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:fg-muted outline-none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-fg-muted hover:text-foreground hover:bg-bg-subtle transition-smooth"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="size-4" strokeWidth={1.5} /> : <Moon className="size-4" strokeWidth={1.5} />}
            </button>
            <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg p-1.5 text-fg-muted hover:bg-bg-subtle hover:text-foreground transition-smooth"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="size-8 rounded-full bg-bg-subtle flex items-center justify-center border border-border">
                <User className="size-4" strokeWidth={1.5} />
              </div>
            </button>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden="true"
                  onClick={() => setProfileOpen(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-bg-elevated shadow-soft-lg py-1 z-50"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">Account</p>
                    <p className="text-xs text-fg-muted">Signed in</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-bg-subtle transition-smooth"
                    role="menuitem"
                  >
                    <LogOut className="size-4" strokeWidth={1.5} />
                    Log out
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

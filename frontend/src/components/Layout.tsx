import { useState, useEffect } from 'react';
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
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const location = useLocation();

  // Initialize dark mode on mount
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    setDarkMode(newDarkMode);
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const sidebarWidth = sidebarCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar';

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r border-border bg-bg-elevated transition-all duration-fast flex flex-col lg:relative lg:z-0',
          sidebarWidth,
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="flex h-header items-center px-4 border-b border-border">
          <div className={cn(
            'flex items-center gap-3 flex-1',
            sidebarCollapsed && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-[var(--radius)] bg-foreground text-background flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-h4 tracking-tight text-foreground">
                Productivity
              </span>
            )}
          </div>
          
          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 -mr-2 text-fg-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <Link
                key={label}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-fast',
                  sidebarCollapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-bg-subtle text-foreground'
                    : 'text-fg-muted hover:bg-bg-subtle hover:text-foreground'
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                {!sidebarCollapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={cn(
              'flex items-center gap-2 w-full rounded-[var(--radius-sm)] px-3 py-2 text-fg-muted hover:text-foreground hover:bg-bg-subtle transition-fast',
              sidebarCollapsed && 'justify-center'
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden',
          'pl-0'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-header items-center gap-4 border-b border-border bg-bg-elevated/80 backdrop-blur-xl px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-[var(--radius-sm)] text-fg-muted hover:text-foreground hover:bg-bg-subtle"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div
            className={cn(
              'flex-1 max-w-md flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 transition-fast',
              searchFocused && 'border-border-hover ring-2 ring-ring/20'
            )}
          >
            <Search className="w-4 h-4 text-fg-subtle shrink-0" strokeWidth={1.5} />
            <input
              type="search"
              placeholder="Search tasks, notes, events..."
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-fg-subtle outline-none"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-sm)] text-fg-muted hover:text-foreground hover:bg-bg-subtle transition-fast"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] p-1.5 text-fg-muted hover:bg-bg-subtle hover:text-foreground transition-fast"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-bg-subtle flex items-center justify-center border border-border">
                  <User className="w-4 h-4" strokeWidth={1.5} />
                </div>
              </button>

              {profileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    aria-hidden="true"
                    onClick={() => setProfileOpen(false)}
                  />
                  {/* Dropdown */}
                  <div
                    className="absolute right-0 top-full mt-2 w-56 rounded-[var(--radius)] border border-border bg-bg-elevated shadow-lg py-1 z-50 animate-fade-in"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">Account</p>
                      <p className="text-caption">Signed in</p>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-bg-subtle transition-fast"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

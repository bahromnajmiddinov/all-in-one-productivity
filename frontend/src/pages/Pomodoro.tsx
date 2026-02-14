import { useState, useEffect } from 'react';
import { Timer, BarChart3, History } from 'lucide-react';
import { PomodoroTimer, PomodoroAnalytics, PomodoroHistory } from '../components/pomodoro';

export function Pomodoro() {
  const [activeTab, setActiveTab] = useState<'timer' | 'analytics' | 'history'>('timer');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const tabs = [
    { id: 'timer' as const, label: 'Timer', icon: Timer },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'history' as const, label: 'History', icon: History },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pomodoro Timer</h1>
        <p className="text-muted-foreground mt-1">
          Focus sessions with customizable work and break intervals
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border mb-8">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'timer' && <PomodoroTimer />}
        {activeTab === 'analytics' && <PomodoroAnalytics />}
        {activeTab === 'history' && <PomodoroHistory />}
      </div>
    </div>
  );
}

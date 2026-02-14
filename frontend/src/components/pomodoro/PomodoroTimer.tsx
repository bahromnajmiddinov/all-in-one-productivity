import { useEffect, useState } from 'react';
import { pomodoroApi } from '../../api';

interface PomodoroTimerProps {
  taskId?: string;
}

type PomodoroSessionType = 'work' | 'short_break' | 'long_break';

type PomodoroSettings = {
  work_duration: number;
  short_break: number;
  long_break: number;
  auto_start_breaks: boolean;
  auto_start_work: boolean;
};

type PomodoroStats = {
  today_count: number;
  today_minutes: number;
  week_count: number;
  week_minutes: number;
};

export function PomodoroTimer({ taskId }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<PomodoroSettings>({
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    auto_start_breaks: false,
    auto_start_work: false,
  });
  const [settingsDraft, setSettingsDraft] = useState<PomodoroSettings>({
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    auto_start_breaks: false,
    auto_start_work: false,
  });
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<PomodoroSessionType>('work');
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [stats, setStats] = useState<PomodoroStats>({
    today_count: 0,
    today_minutes: 0,
    week_count: 0,
    week_minutes: 0,
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      completeSession();
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeLeft]);

  const loadSettings = async () => {
    try {
      const response = await pomodoroApi.getSettings();
      setSettings(response.data);
      setSettingsDraft(response.data);
      if (!isActive) {
        setTimeLeft(getDurationSeconds(response.data, sessionType));
      }
    } catch (error) {
      console.error('Failed to load settings');
    }
  };

  const loadStats = async () => {
    try {
      const response = await pomodoroApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const startSession = async () => {
    try {
      const duration = getDurationMinutes(settings, sessionType);
      const response = await pomodoroApi.createSession({
        session_type: sessionType,
        duration,
        task: taskId,
      });

      setCurrentSession(response.data.id);
      setTimeLeft(duration * 60);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start session');
    }
  };

  const completeSession = async () => {
    if (currentSession) {
      try {
        await pomodoroApi.completeSession(currentSession);
        setIsActive(false);
        setCurrentSession(null);
        loadStats();

        if (sessionType === 'work') {
          setSessionType('short_break');
          setTimeLeft(settings.short_break * 60);
        } else {
          setSessionType('work');
          setTimeLeft(settings.work_duration * 60);
        }
      } catch (error) {
        console.error('Failed to complete session');
      }
    }
  };

  const toggleTimer = () => {
    if (!isActive && !currentSession) {
      startSession();
    } else {
      setIsActive((prev) => !prev);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return 'bg-foreground';
      case 'short_break':
        return 'bg-foreground/70';
      case 'long_break':
        return 'bg-foreground/50';
      default:
        return 'bg-foreground';
    }
  };

  const handleSettingsChange = <K extends keyof PomodoroSettings>(
    key: K,
    value: PomodoroSettings[K]
  ) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      const response = await pomodoroApi.updateSettings(settingsDraft);
      setSettings(response.data);
      setSettingsDraft(response.data);
      if (!isActive && !currentSession) {
        setTimeLeft(getDurationSeconds(response.data, sessionType));
      }
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to update settings');
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-soft p-8 max-w-md mx-auto">
      <div className="flex justify-between mb-6 text-caption text-fg-muted">
        <span>Today: {stats.today_count} sessions</span>
        <span>{stats.today_minutes} min focused</span>
      </div>

      <div className="flex mb-6 bg-bg-subtle rounded-lg p-1">
        {(['work', 'short_break', 'long_break'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              if (!isActive && !currentSession) {
                setSessionType(type);
                setTimeLeft(getDurationSeconds(settings, type));
              }
            }}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-smooth ${
              sessionType === type
                ? 'bg-bg-elevated text-foreground shadow-soft'
                : 'text-fg-muted hover:text-foreground'
            } ${isActive || currentSession ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {type === 'work' ? 'Focus' : type === 'short_break' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      <div className="text-center mb-8">
        <div
          className={`text-7xl font-semibold font-mono tracking-tight mb-2 ${
            timeLeft < 60 ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-caption text-fg-muted capitalize">{sessionType.replace('_', ' ')}</div>
      </div>

      <div className="w-full bg-bg-subtle rounded-full h-2 mb-6 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${getSessionColor()}`}
          style={{
            width: `${((getTotalTime() - timeLeft) / getTotalTime()) * 100}%`,
          }}
        />
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={toggleTimer}
          className={`px-8 py-3 rounded-lg font-medium transition-smooth ${
            isActive
              ? 'bg-foreground/90 text-background hover:opacity-90'
              : 'bg-foreground text-background hover:opacity-90'
          }`}
        >
          {isActive ? 'Pause' : currentSession ? 'Resume' : 'Start'}
        </button>
        {currentSession && (
          <button
            type="button"
            onClick={completeSession}
            className="px-6 py-3 rounded-lg font-medium border border-border bg-bg-elevated text-foreground hover:bg-bg-subtle transition-smooth"
          >
            Complete
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowSettings((prev) => !prev)}
        className="mt-6 text-sm text-fg-muted hover:text-foreground transition-smooth"
      >
        Settings
      </button>

      {showSettings && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid gap-4">
            <label className="text-sm text-foreground">
              Focus duration (minutes)
              <input
                type="number"
                min={1}
                value={settingsDraft.work_duration}
                onChange={(event) =>
                  handleSettingsChange('work_duration', Number(event.target.value))
                }
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="text-sm text-foreground">
              Short break (minutes)
              <input
                type="number"
                min={1}
                value={settingsDraft.short_break}
                onChange={(event) =>
                  handleSettingsChange('short_break', Number(event.target.value))
                }
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="text-sm text-foreground">
              Long break (minutes)
              <input
                type="number"
                min={1}
                value={settingsDraft.long_break}
                onChange={(event) =>
                  handleSettingsChange('long_break', Number(event.target.value))
                }
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settingsDraft.auto_start_breaks}
                onChange={(event) =>
                  handleSettingsChange('auto_start_breaks', event.target.checked)
                }
                className="rounded border-border"
              />
              Auto-start breaks
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={settingsDraft.auto_start_work}
                onChange={(event) =>
                  handleSettingsChange('auto_start_work', event.target.checked)
                }
                className="rounded border-border"
              />
              Auto-start focus sessions
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-bg-subtle transition-smooth"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-smooth"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function getTotalTime() {
    return getDurationSeconds(settings, sessionType);
  }
}

function getDurationMinutes(settings: PomodoroSettings, sessionType: PomodoroSessionType) {
  return sessionType === 'work'
    ? settings.work_duration
    : sessionType === 'short_break'
      ? settings.short_break
      : settings.long_break;
}

function getDurationSeconds(settings: PomodoroSettings, sessionType: PomodoroSessionType) {
  return getDurationMinutes(settings, sessionType) * 60;
}

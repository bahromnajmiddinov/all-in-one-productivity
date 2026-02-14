import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Settings, RotateCcw, AlertCircle, CheckCircle, Flame, Target, Clock, Activity } from 'lucide-react';
import { pomodoroApi, taskApi } from '../../api';

interface Task {
  id: string;
  title: string;
  project_info?: { name: string; color: string };
}

interface PomodoroSettings {
  work_duration: number;
  short_break: number;
  long_break: number;
  auto_start_breaks: boolean;
  auto_start_work: boolean;
  long_break_interval: number;
  daily_pomodoro_goal: number;
  enable_break_enforcement: boolean;
  break_enforcement_delay: number;
  enable_sound_notifications: boolean;
  enable_desktop_notifications: boolean;
}

interface PomodoroStats {
  today_count: number;
  today_minutes: number;
  today_completed: number;
  today_productivity_avg: number;
  current_streak: number;
  longest_streak: number;
}

interface FocusStreak {
  current_streak: number;
  longest_streak: number;
  sessions_today: number;
  daily_goal_progress: {
    completed: number;
    goal: number;
    percentage: number;
  };
}

type PomodoroSessionType = 'work' | 'short_break' | 'long_break';
type DistractionType = 'notification' | 'conversation' | 'environmental' | 'physical' | 'mental' | 'other';

const DISTRACTION_TYPES: { value: DistractionType; label: string }[] = [
  { value: 'notification', label: 'Notification' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'physical', label: 'Physical' },
  { value: 'mental', label: 'Mental' },
  { value: 'other', label: 'Other' },
];

export function PomodoroTimer() {
  // Settings & State
  const [settings, setSettings] = useState<PomodoroSettings>({
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    auto_start_breaks: false,
    auto_start_work: false,
    long_break_interval: 4,
    daily_pomodoro_goal: 8,
    enable_break_enforcement: true,
    break_enforcement_delay: 5,
    enable_sound_notifications: true,
    enable_desktop_notifications: true,
  });
  const [settingsDraft, setSettingsDraft] = useState<PomodoroSettings>(settings);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<PomodoroSessionType>('work');
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);

  // Stats & Streaks
  const [stats, setStats] = useState<PomodoroStats>({
    today_count: 0,
    today_minutes: 0,
    today_completed: 0,
    today_productivity_avg: 0,
    current_streak: 0,
    longest_streak: 0,
  });
  const [streak, setStreak] = useState<FocusStreak>({
    current_streak: 0,
    longest_streak: 0,
    sessions_today: 0,
    daily_goal_progress: { completed: 0, goal: 8, percentage: 0 },
  });

  // Task Integration
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showDistractionModal, setShowDistractionModal] = useState(false);
  const [showBreakEnforcement, setShowBreakEnforcement] = useState(false);
  const [showProductivityRating, setShowProductivityRating] = useState(false);
  const [productivityScore, setProductivityScore] = useState<number>(5);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [sessionNotes, setSessionNotes] = useState('');

  // Distraction State
  const [distractionType, setDistractionType] = useState<DistractionType>('other');
  const [distractionDescription, setDistractionDescription] = useState('');

  const breakEnforcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial data
  useEffect(() => {
    loadSettings();
    loadStats();
    loadStreak();
    loadTasks();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Break enforcement
  useEffect(() => {
    if (sessionType !== 'work' && settings.enable_break_enforcement && !isActive && currentSession) {
      // Start break enforcement timer
      const delayMs = settings.break_enforcement_delay * 60 * 1000;
      breakEnforcementTimer.current = setTimeout(() => {
        setShowBreakEnforcement(false);
      }, delayMs);
      setShowBreakEnforcement(true);
    }
    return () => {
      if (breakEnforcementTimer.current) {
        clearTimeout(breakEnforcementTimer.current);
      }
    };
  }, [sessionType, settings.enable_break_enforcement]);

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

  const loadStreak = async () => {
    try {
      const response = await pomodoroApi.getFocusStreak();
      setStreak(response.data);
    } catch (error) {
      console.error('Failed to load streak');
    }
  };

  const loadTasks = async () => {
    try {
      const response = await taskApi.getTasks({ status: 'active' });
      setTasks(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load tasks');
    }
  };

  const playNotificationSound = () => {
    if (settings.enable_sound_notifications) {
      // Simple beep using AudioContext
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    }
  };

  const sendDesktopNotification = (title: string, body: string) => {
    if (settings.enable_desktop_notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const startSession = async () => {
    try {
      const duration = getDurationMinutes(settings, sessionType);
      const response = await pomodoroApi.createSession({
        session_type: sessionType,
        duration,
        task: selectedTask || undefined,
        notes: sessionNotes,
      });

      setCurrentSession(response.data.id);
      setTimeLeft(duration * 60);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start session');
    }
  };

  const handleSessionComplete = async () => {
    if (!currentSession) return;

    playNotificationSound();
    setIsActive(false);

    if (sessionType === 'work') {
      // Show productivity rating for work sessions
      setShowProductivityRating(true);
    } else {
      // Complete break session immediately
      await completeCurrentSession();
    }
  };

  const completeCurrentSession = async (withProductivityData?: { score: number; energy: number }) => {
    if (!currentSession) return;

    try {
      // Update session with productivity data
      if (withProductivityData) {
        await pomodoroApi.updateSession(currentSession, {
          productivity_score: withProductivityData.score,
          energy_level: withProductivityData.energy,
          notes: sessionNotes,
        });
      }

      // Complete the session
      await pomodoroApi.completeSession(currentSession);

      sendDesktopNotification(
        sessionType === 'work' ? 'Focus Session Complete!' : 'Break Complete!',
        sessionType === 'work' ? 'Great job! Time for a break.' : 'Ready to focus again?'
      );

      // Update state
      if (sessionType === 'work') {
        setCompletedWorkSessions((prev) => prev + 1);
        setShowProductivityRating(false);
      }

      setCurrentSession(null);
      setSessionNotes('');
      setProductivityScore(5);
      setEnergyLevel(3);

      // Determine next session type
      let nextType: PomodoroSessionType;
      if (sessionType === 'work') {
        const isLongBreakTime = (completedWorkSessions + 1) % settings.long_break_interval === 0;
        nextType = isLongBreakTime ? 'long_break' : 'short_break';
      } else {
        nextType = 'work';
      }

      setSessionType(nextType);
      setTimeLeft(getDurationSeconds(settings, nextType));

      // Auto-start if enabled
      if ((sessionType === 'work' && settings.auto_start_breaks) ||
          (sessionType !== 'work' && settings.auto_start_work)) {
        setTimeout(() => startSession(), 1000);
      }

      // Refresh stats
      loadStats();
      loadStreak();
    } catch (error) {
      console.error('Failed to complete session');
    }
  };

  const handleInterrupt = async () => {
    if (!currentSession) return;

    setIsActive(false);
    setShowDistractionModal(true);
  };

  const submitDistraction = async () => {
    if (!currentSession) return;

    try {
      await pomodoroApi.interruptSession(currentSession, {
        distraction_type: distractionType,
        description: distractionDescription,
      });

      setShowDistractionModal(false);
      setDistractionDescription('');
    } catch (error) {
      console.error('Failed to log distraction');
    }
  };

  const toggleTimer = () => {
    if (!isActive && !currentSession) {
      startSession();
    } else {
      setIsActive((prev) => !prev);
    }
  };

  const skipBreak = () => {
    setShowBreakEnforcement(false);
    setSessionType('work');
    setTimeLeft(getDurationSeconds(settings, 'work'));
    if (breakEnforcementTimer.current) {
      clearTimeout(breakEnforcementTimer.current);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setCurrentSession(null);
    setTimeLeft(getDurationSeconds(settings, sessionType));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return 'bg-primary';
      case 'short_break':
        return 'bg-chart-2';
      case 'long_break':
        return 'bg-chart-3';
      default:
        return 'bg-primary';
    }
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work':
        return 'Focus';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  };

  const handleSettingsChange = <K extends keyof PomodoroSettings>(
    key: K,
    value: PomodoroSettings[K]
  ) => {
    setSettingsDraft((prev) => ({ ...prev, [key]: value }));
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

  const getTotalTime = () => getDurationSeconds(settings, sessionType);

  const progress = ((getTotalTime() - timeLeft) / getTotalTime()) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Today</span>
          </div>
          <div className="text-2xl font-bold">{stats.today_count}</div>
          <div className="text-xs text-muted-foreground">sessions</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Focused</span>
          </div>
          <div className="text-2xl font-bold">{stats.today_minutes}</div>
          <div className="text-xs text-muted-foreground">minutes</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Streak</span>
          </div>
          <div className="text-2xl font-bold">{streak.current_streak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Goal</span>
          </div>
          <div className="text-2xl font-bold">{streak.daily_goal_progress.percentage}%</div>
          <div className="text-xs text-muted-foreground">
            {streak.daily_goal_progress.completed}/{streak.daily_goal_progress.goal}
          </div>
        </div>
      </div>

      {/* Main Timer Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 max-w-lg mx-auto">
        {/* Session Type Selector */}
        <div className="flex mb-6 bg-muted rounded-lg p-1">
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
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
                sessionType === type
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              } ${isActive || currentSession ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {type === 'work' ? 'Focus' : type === 'short_break' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        {/* Task Selector */}
        {sessionType === 'work' && (
          <div className="mb-6">
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={isActive || !!currentSession}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Select a task (optional)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} {task.project_info ? `(${task.project_info.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div
            className={`text-7xl font-mono font-bold tracking-tight mb-2 ${
              timeLeft < 60 ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-muted-foreground capitalize">{getSessionLabel()}</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${getSessionColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={toggleTimer}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isActive ? (
              <><Pause className="w-4 h-4" /> Pause</>
            ) : currentSession ? (
              <><Play className="w-4 h-4" /> Resume</>
            ) : (
              <><Play className="w-4 h-4" /> Start</>
            )}
          </button>

          {currentSession && (
            <button
              type="button"
              onClick={handleInterrupt}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium border border-border bg-background hover:bg-muted transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Distraction
            </button>
          )}

          {(isActive || currentSession) && (
            <button
              type="button"
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium border border-border bg-background hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="mt-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Focus (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settingsDraft.work_duration}
                    onChange={(e) => handleSettingsChange('work_duration', Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Short Break</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settingsDraft.short_break}
                    onChange={(e) => handleSettingsChange('short_break', Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Long Break</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settingsDraft.long_break}
                    onChange={(e) => handleSettingsChange('long_break', Number(e.target.value))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Sessions before long break
                </label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={settingsDraft.long_break_interval}
                  onChange={(e) => handleSettingsChange('long_break_interval', Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Daily goal (sessions)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settingsDraft.daily_pomodoro_goal}
                  onChange={(e) => handleSettingsChange('daily_pomodoro_goal', Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settingsDraft.auto_start_breaks}
                    onChange={(e) => handleSettingsChange('auto_start_breaks', e.target.checked)}
                    className="rounded border-border"
                  />
                  Auto-start breaks
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settingsDraft.auto_start_work}
                    onChange={(e) => handleSettingsChange('auto_start_work', e.target.checked)}
                    className="rounded border-border"
                  />
                  Auto-start focus sessions
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settingsDraft.enable_break_enforcement}
                    onChange={(e) => handleSettingsChange('enable_break_enforcement', e.target.checked)}
                    className="rounded border-border"
                  />
                  Enforce breaks
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settingsDraft.enable_sound_notifications}
                    onChange={(e) => handleSettingsChange('enable_sound_notifications', e.target.checked)}
                    className="rounded border-border"
                  />
                  Sound notifications
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settingsDraft.enable_desktop_notifications}
                    onChange={(e) => handleSettingsChange('enable_desktop_notifications', e.target.checked)}
                    className="rounded border-border"
                  />
                  Desktop notifications
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSettings}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Distraction Modal */}
      {showDistractionModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Log Distraction</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Distraction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {DISTRACTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setDistractionType(type.value)}
                      className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                        distractionType === type.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Description (optional)</label>
                <textarea
                  value={distractionDescription}
                  onChange={(e) => setDistractionDescription(e.target.value)}
                  placeholder="What distracted you?"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitDistraction}
                  className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Log & Resume
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDistractionModal(false);
                    setIsActive(true);
                  }}
                  className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Break Enforcement Modal */}
      {showBreakEnforcement && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-chart-2" />
              <h3 className="text-lg font-semibold">Take a Break!</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Breaks are important for maintaining focus and preventing burnout. 
              Please take at least a {settings.break_enforcement_delay} minute break.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBreakEnforcement(false);
                  startSession();
                }}
                className="flex-1 px-4 py-2 rounded-md bg-chart-2 text-white hover:bg-chart-2/90 transition-colors"
              >
                Start Break
              </button>
              <button
                type="button"
                onClick={skipBreak}
                className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Productivity Rating Modal */}
      {showProductivityRating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-chart-2" />
              <h3 className="text-lg font-semibold">Session Complete!</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  How productive was this session? ({productivityScore}/10)
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={productivityScore}
                  onChange={(e) => setProductivityScore(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Distracted</span>
                  <span>Focused</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Energy level ({energyLevel}/5)
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Notes (optional)</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Any notes about this session..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
              <button
                type="button"
                onClick={() => completeCurrentSession({ score: productivityScore, energy: energyLevel })}
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Complete Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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

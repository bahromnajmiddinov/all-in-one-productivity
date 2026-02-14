import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Filter,
  Target,
  Star,
  Zap,
  Search,
  AlertTriangle
} from 'lucide-react';
import { pomodoroApi } from '../../api';

interface Session {
  id: string;
  session_type: 'work' | 'short_break' | 'long_break';
  duration: number;
  actual_duration: number;
  task: string | null;
  task_title: string | null;
  project: string | null;
  project_name: string | null;
  task_project_name: string | null;
  started_at: string;
  ended_at: string | null;
  completed: boolean;
  interruptions: number;
  notes: string;
  productivity_score: number | null;
  energy_level: number | null;
  distractions: {
    id: string;
    distraction_type: string;
    description: string;
    recovered: boolean;
  }[];
}

interface Filters {
  session_type: string;
  completed: string;
  task: string;
  project: string;
  start_date: string;
  end_date: string;
}

export function PomodoroHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    session_type: '',
    completed: '',
    task: '',
    project: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async (filterParams?: Partial<Filters>) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterParams?.session_type) params.session_type = filterParams.session_type;
      if (filterParams?.completed) params.completed = filterParams.completed;
      if (filterParams?.task) params.task = filterParams.task;
      if (filterParams?.project) params.project = filterParams.project;
      if (filterParams?.start_date) params.start_date = filterParams.start_date;
      if (filterParams?.end_date) params.end_date = filterParams.end_date;

      const response = await pomodoroApi.getSessionHistory(params);
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadSessions(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      session_type: '',
      completed: '',
      task: '',
      project: '',
      start_date: '',
      end_date: '',
    };
    setFilters(emptyFilters);
    loadSessions(emptyFilters);
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'work':
        return <Target className="w-4 h-4" />;
      case 'short_break':
      case 'long_break':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'work':
        return 'bg-primary/10 text-primary';
      case 'short_break':
        return 'bg-chart-2/10 text-chart-2';
      case 'long_break':
        return 'bg-chart-3/10 text-chart-3';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'work':
        return 'Focus';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      default:
        return type;
    }
  };

  const groupSessionsByDate = (sessions: Session[]) => {
    const groups: Record<string, Session[]> = {};
    sessions.forEach((session) => {
      const date = format(parseISO(session.started_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });
    return groups;
  };

  const groupedSessions = groupSessionsByDate(sessions);

  const calculateDayStats = (daySessions: Session[]) => {
    const workSessions = daySessions.filter(s => s.session_type === 'work');
    const completed = workSessions.filter(s => s.completed).length;
    const totalMinutes = workSessions
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.duration, 0);
    const avgProductivity = workSessions
      .filter(s => s.productivity_score)
      .reduce((sum, s, _, arr) => sum + (s.productivity_score || 0) / arr.length, 0);
    const totalDistractions = workSessions.reduce((sum, s) => sum + s.interruptions, 0);

    return { completed, totalMinutes, avgProductivity, totalDistractions };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold">Session History</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'border-border hover:bg-muted'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Session Type</label>
              <select
                value={filters.session_type}
                onChange={(e) => setFilters({ ...filters, session_type: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="work">Focus</option>
                <option value="short_break">Short Break</option>
                <option value="long_break">Long Break</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select
                value={filters.completed}
                onChange={(e) => setFilters({ ...filters, completed: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Search className="w-4 h-4" />
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sessions found</p>
          <p className="text-sm mt-1">Start your first Pomodoro session to see history</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([date, daySessions]) => {
            const stats = calculateDayStats(daySessions);
            return (
              <div key={date} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Day Header */}
                <div className="px-6 py-4 bg-muted/50 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold">
                        {format(parseISO(date), 'EEEE, MMMM do, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {stats.completed} completed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {stats.totalMinutes} min
                      </span>
                      {stats.avgProductivity > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {stats.avgProductivity.toFixed(1)}/10
                        </span>
                      )}
                      {stats.totalDistractions > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <AlertTriangle className="w-4 h-4" />
                          {stats.totalDistractions}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Day Sessions */}
                <div className="divide-y divide-border">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className="px-6 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${getSessionTypeColor(session.session_type)}`}>
                            {getSessionTypeIcon(session.session_type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{getSessionTypeLabel(session.session_type)}</span>
                              {session.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {format(parseISO(session.started_at), 'h:mm a')}
                              {' - '}
                              {session.duration} min
                              {session.actual_duration !== session.duration && (
                                <span className="text-muted-foreground">
                                  {' '}({session.actual_duration} min actual)
                                </span>
                              )}
                            </div>
                            {session.task_title && (
                              <div className="flex items-center gap-1 text-sm mt-1">
                                <Target className="w-3 h-3 text-muted-foreground" />
                                <span>{session.task_title}</span>
                                {session.task_project_name && (
                                  <span className="text-muted-foreground">
                                    ({session.task_project_name})
                                  </span>
                                )}
                              </div>
                            )}
                            {session.notes && (
                              <div className="text-sm text-muted-foreground mt-2 italic">
                                "{session.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {session.productivity_score && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{session.productivity_score}/10</span>
                            </div>
                          )}
                          {session.energy_level && (
                            <div className="flex items-center gap-1 text-sm">
                              <Zap className="w-4 h-4 text-orange-500" />
                              <span>{session.energy_level}/5</span>
                            </div>
                          )}
                          {session.interruptions > 0 && (
                            <div className="flex items-center gap-1 text-sm text-yellow-500">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{session.interruptions}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Distractions */}
                      {session.distractions && session.distractions.length > 0 && (
                        <div className="mt-3 pl-12">
                          <div className="text-xs text-muted-foreground mb-2">Distractions:</div>
                          <div className="flex flex-wrap gap-2">
                            {session.distractions.map((d) => (
                              <span
                                key={d.id}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  d.recovered 
                                    ? 'bg-green-500/10 text-green-600' 
                                    : 'bg-yellow-500/10 text-yellow-600'
                                }`}
                              >
                                {d.distraction_type.replace('_', ' ')}
                                {d.description && `: ${d.description}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

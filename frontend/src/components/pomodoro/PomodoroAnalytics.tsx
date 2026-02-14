import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Clock, 
  Calendar, 
  Award,
  AlertTriangle,
} from 'lucide-react';
import { pomodoroApi } from '../../api';

interface TimeOfDayData {
  hour: number;
  session_count: number;
  total_minutes: number;
  avg_productivity: number;
  completion_rate: number;
}

interface DailyData {
  date: string;
  session_count: number;
  total_minutes: number;
  completed_sessions: number;
  distractions: number;
  avg_productivity: number;
}

interface ProjectData {
  project_id: string;
  project_name: string;
  session_count: number;
  total_minutes: number;
  avg_productivity: number;
}

interface ProductivityScore {
  overall_score: number;
  focus_quality_score: number;
  consistency_score: number;
  completion_rate_score: number;
  streak_score: number;
}

interface DistractionSummary {
  distraction_type: string;
  count: number;
  avg_recovery: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PomodoroAnalytics() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [timeOfDayData, setTimeOfDayData] = useState<TimeOfDayData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [productivityScore, setProductivityScore] = useState<ProductivityScore | null>(null);
  const [distractionSummary, setDistractionSummary] = useState<DistractionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = timeRange === 'week' ? 7 : 30;
      
      const [
        timeOfDayRes,
        dailyRes,
        projectRes,
        scoreRes,
        distractionRes
      ] = await Promise.all([
        pomodoroApi.getTimeOfDayAnalytics(days),
        pomodoroApi.getDailyAnalytics(days),
        pomodoroApi.getProjectAnalytics(days),
        pomodoroApi.getProductivityScore(timeRange),
        pomodoroApi.getDistractionSummary(),
      ]);

      setTimeOfDayData(timeOfDayRes.data);
      setDailyData(dailyRes.data);
      setProjectData(projectRes.data);
      setProductivityScore(scoreRes.data);
      setDistractionSummary(distractionRes.data);
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
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
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-border p-1 bg-card">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Productivity Score */}
      {productivityScore && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold">Productivity Score</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`p-4 rounded-lg ${getScoreBg(productivityScore.overall_score)}`}>
              <div className={`text-3xl font-bold ${getScoreColor(productivityScore.overall_score)}`}>
                {productivityScore.overall_score}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Overall</div>
            </div>
            <div className={`p-4 rounded-lg ${getScoreBg(productivityScore.focus_quality_score * 4)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(productivityScore.focus_quality_score * 4)}`}>
                {productivityScore.focus_quality_score}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Focus Quality</div>
            </div>
            <div className={`p-4 rounded-lg ${getScoreBg(productivityScore.consistency_score * 4)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(productivityScore.consistency_score * 4)}`}>
                {productivityScore.consistency_score}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Consistency</div>
            </div>
            <div className={`p-4 rounded-lg ${getScoreBg(productivityScore.completion_rate_score * 4)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(productivityScore.completion_rate_score * 4)}`}>
                {productivityScore.completion_rate_score}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Completion</div>
            </div>
            <div className={`p-4 rounded-lg ${getScoreBg(productivityScore.streak_score * 4)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(productivityScore.streak_score * 4)}`}>
                {productivityScore.streak_score}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Streak</div>
            </div>
          </div>
        </div>
      )}

      {/* Time of Day Heatmap */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Time of Day Effectiveness</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeOfDayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={formatHour}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelFormatter={(value) => formatHour(Number(value))}
              />
              <Bar dataKey="session_count" fill="hsl(var(--primary))" name="Sessions" />
              <Bar dataKey="avg_productivity" fill="hsl(var(--chart-2))" name="Avg Productivity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Progress */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Daily Progress</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDay}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => formatDay(String(value))}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_minutes" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Focus Minutes"
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_productivity" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Productivity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Time by Project</h3>
          </div>
          {projectData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) => {
                      const { name, percent } = props;
                      if (typeof name === 'string' && typeof percent === 'number') {
                        return `${name}: ${(percent * 100).toFixed(0)}%`;
                      }
                      return '';
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_minutes"
                  >
                    {projectData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No project data available
            </div>
          )}
        </div>
      </div>

      {/* Distraction Analysis */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Distraction Analysis</h3>
        </div>
        {distractionSummary.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {distractionSummary.map((item) => (
              <div key={item.distraction_type} className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {item.distraction_type.replace('_', ' ')}
                </div>
                {item.avg_recovery && (
                  <div className="text-xs text-muted-foreground mt-1">
                    avg {Math.round(item.avg_recovery / 60)}m recovery
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No distractions logged yet. Great focus!
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { moodApi } from '../api';
import type {
  MoodEntry,
  MoodScale,
  MoodStats,
  MoodInsight,
  MoodPattern,
  EmotionWheelItem,
} from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Smile,
  Frown,
  Meh,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Activity,
  Lightbulb,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChartIcon,
  Target,
  Zap,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const TIME_PERIODS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '3 Months' },
  { value: 365, label: 'Year' },
];

export default function Mood() {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'patterns' | 'emotions' | 'insights'>('overview');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [scales, setScales] = useState<MoodScale[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [patterns, setPatterns] = useState<MoodPattern[]>([]);
  const [emotionWheel, setEmotionWheel] = useState<EmotionWheelItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogMood, setQuickLogMood] = useState(5);
  const [quickLogNotes, setQuickLogNotes] = useState('');
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, scalesRes, statsRes, insightsRes, patternsRes, timelineRes, heatmapRes, wheelRes] = await Promise.all([
        moodApi.getEntries({ days: selectedPeriod }),
        moodApi.getScales(),
        moodApi.getStats(),
        moodApi.getInsights(),
        moodApi.getPatterns(selectedPeriod),
        moodApi.getTimeline(selectedPeriod),
        moodApi.getHeatmap(new Date().getFullYear()),
        moodApi.getEmotionWheel(),
      ]);

      setEntries(entriesRes.data.results || entriesRes.data);
      setScales(scalesRes.data.results || scalesRes.data);
      setStats(statsRes.data);
      setInsights(insightsRes.data.results || insightsRes.data);
      setPatterns(patternsRes.data.patterns || []);
      setTimelineData(timelineRes.data.timeline || []);
      setHeatmapData(heatmapRes.data || []);
      setEmotionWheel(wheelRes.data || []);
    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLog = async () => {
    try {
      const now = new Date();
      const hour = now.getHours();
      let timeOfDay = 'anytime';
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';

      await moodApi.quickLog({
        mood_value: quickLogMood,
        time_of_day: timeOfDay,
        notes: quickLogNotes,
      });

      setIsQuickLogOpen(false);
      setQuickLogMood(5);
      setQuickLogNotes('');
      fetchData();
    } catch (error) {
      console.error('Error logging mood:', error);
    }
  };

  const dismissInsight = async (id: string) => {
    try {
      await moodApi.dismissInsight(id);
      setInsights(insights.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    }
  };

  const getMoodEmoji = (value: number) => {
    if (value >= 9) return '🤩';
    if (value >= 8) return '😄';
    if (value >= 7) return '😊';
    if (value >= 6) return '🙂';
    if (value >= 5) return '😐';
    if (value >= 4) return '😕';
    if (value >= 3) return '☹️';
    if (value >= 2) return '😞';
    return '😢';
  };

  const getMoodColor = (value: number) => {
    if (value >= 8) return '#10B981';
    if (value >= 6) return '#34D399';
    if (value >= 5) return '#FBBF24';
    if (value >= 3) return '#F97316';
    return '#EF4444';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mood Tracking</h1>
          <p className="text-gray-600 mt-1">Track, analyze, and understand your emotional well-being</p>
        </div>
        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Log Mood
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.current_streak || 0} <span className="text-lg font-normal text-gray-500">days</span></p>
          <p className="text-sm text-gray-500 mt-1">Best: {stats?.best_streak || 0} days</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smile className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">7-Day Average</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.avg_mood_7d?.toFixed(1) || '-'}</p>
          <p className="text-sm text-gray-500 mt-1">30-day: {stats?.avg_mood_30d?.toFixed(1) || '-'}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Total Entries</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_entries || 0}</p>
          <p className="text-sm text-gray-500 mt-1">This period: {entries.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-600">Top Emotion</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 capitalize">{stats?.top_emotions?.[0]?.emotion || '-'}</p>
          <p className="text-sm text-gray-500 mt-1">{stats?.top_emotions?.[0]?.count || 0} times</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'timeline', label: 'Timeline', icon: TrendingUp },
          { id: 'patterns', label: 'Patterns', icon: Target },
          { id: 'emotions', label: 'Emotions', icon: Smile },
          { id: 'insights', label: 'Insights', icon: Lightbulb },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {TIME_PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedPeriod === period.value
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Mood Timeline Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Timeline</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'MMM d')}
                    stroke="#6B7280"
                  />
                  <YAxis domain={[0, 10]} stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    formatter={(value: number) => [value.toFixed(1), 'Mood']}
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood_value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  {timelineData.some(d => d.rolling_avg_7d) && (
                    <Line
                      type="monotone"
                      dataKey="rolling_avg_7d"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Daily Mood</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">7-Day Average</span>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Distribution */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(stats?.mood_distribution || {}).map(([value, count]) => ({
                      value: Number(value),
                      count,
                      label: `${value} ${getMoodEmoji(Number(value))}`,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="value" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      formatter={(value: number) => [value, 'Entries']}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time of Day Averages */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood by Time of Day</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={Object.entries(stats?.time_of_day_averages || {}).map(([time, avg]) => ({
                      time: time.charAt(0).toUpperCase() + time.slice(1),
                      avg: Number(avg.toFixed(1)),
                      fullMark: 10,
                    }))}
                  >
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="time" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <Radar
                      name="Average Mood"
                      dataKey="avg"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Calendar Heatmap */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Calendar</h3>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {heatmapData.slice(-42).map((day, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{ backgroundColor: day.color || '#F3F4F6' }}
                  title={`${format(new Date(day.date), 'MMM d')}: ${day.mood_value?.toFixed(1) || 'No data'}`}
                >
                  {day.mood_value ? day.mood_value.toFixed(0) : ''}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="text-gray-500">Low</span>
              <div className="flex gap-1">
                {['#EF4444', '#F97316', '#FBBF24', '#34D399', '#10B981'].map((color) => (
                  <div key={color} className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                ))}
              </div>
              <span className="text-gray-500">High</span>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: getMoodColor(entry.mood_value) + '20' }}
                  >
                    {getMoodEmoji(entry.mood_value)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        Mood {entry.mood_value}/10
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.time_of_day_display}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.entry_date), 'MMM d, yyyy')} at {entry.entry_time}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{entry.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {entry.factors_count > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {entry.factors_count} factors
                      </span>
                    )}
                    {entry.emotions_count > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {entry.emotions_count} emotions
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          {patterns.map((pattern, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {pattern.pattern_type.replace('_', ' ')} Pattern
                  </h3>
                  <p className="text-gray-600 mt-2">{pattern.insight}</p>
                  
                  {pattern.pattern_data.by_day && (
                    <div className="mt-4">
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(pattern.pattern_data.by_day).map(([day, avg]) => ({
                              day,
                              avg: Number(avg),
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                            <YAxis domain={[0, 10]} stroke="#6B7280" />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                              formatter={(value: number) => [value.toFixed(1), 'Average Mood']}
                            />
                            <Bar dataKey="avg" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Day of Week Analysis */}
          {stats?.day_of_week_averages && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week Analysis</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(stats.day_of_week_averages).map(([day, avg]) => ({
                      day: day.slice(0, 3),
                      avg: Number(avg.toFixed(1)),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#6B7280" />
                    <YAxis domain={[0, 10]} stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      formatter={(value: number) => [value.toFixed(1), 'Average Mood']}
                    />
                    <Bar dataKey="avg" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'emotions' && (
        <div className="space-y-6">
          {/* Emotion Wheel */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Wheel</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {emotionWheel.map((emotion) => (
                <div
                  key={emotion.primary_emotion}
                  className="p-4 rounded-xl border-2 border-transparent hover:border-gray-200 transition-colors"
                  style={{ backgroundColor: emotion.color + '20' }}
                >
                  <h4 className="font-semibold text-gray-900">{emotion.label}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {emotion.related_emotions.slice(0, 3).map((related) => (
                      <span
                        key={related}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: emotion.color + '40' }}
                      >
                        {related}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Emotions */}
          {stats?.top_emotions && stats.top_emotions.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Top Emotions</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.top_emotions}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="emotion"
                    >
                      {stats.top_emotions.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Active Insights */}
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No insights yet</h3>
                <p className="text-gray-500">Keep logging your mood to receive personalized insights.</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                    insight.insight_type === 'warning'
                      ? 'border-red-200 bg-red-50'
                      : insight.insight_type === 'achievement'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          insight.insight_type === 'warning'
                            ? 'bg-red-100'
                            : insight.insight_type === 'achievement'
                            ? 'bg-green-100'
                            : insight.insight_type === 'pattern'
                            ? 'bg-blue-100'
                            : 'bg-yellow-100'
                        }`}
                      >
                        {insight.insight_type === 'warning' ? (
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        ) : insight.insight_type === 'achievement' ? (
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        ) : insight.insight_type === 'pattern' ? (
                          <Target className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Lightbulb className="w-6 h-6 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                        <p className="text-gray-600 mt-1">{insight.description}</p>
                        
                        {insight.action_items && insight.action_items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Suggested Actions:</p>
                            <ul className="mt-1 space-y-1">
                              {insight.action_items.map((action, idx) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                          <span>{format(new Date(insight.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissInsight(insight.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Factors Impact */}
          {(stats?.top_positive_factors?.length > 0 || stats?.top_negative_factors?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Positive Factors</h3>
                <div className="space-y-3">
                  {stats.top_positive_factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-gray-900 capitalize">{factor.category}</span>
                      <span className="text-green-600 font-semibold">+{factor.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Negative Factors</h3>
                <div className="space-y-3">
                  {stats.top_negative_factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-gray-900 capitalize">{factor.category}</span>
                      <span className="text-red-600 font-semibold">{factor.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Log Modal */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">How are you feeling?</h2>
              <button
                onClick={() => setIsQuickLogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="text-6xl mb-2">{getMoodEmoji(quickLogMood)}</div>
              <div className="text-3xl font-bold text-gray-900">{quickLogMood}/10</div>
              <input
                type="range"
                min="1"
                max="10"
                value={quickLogMood}
                onChange={(e) => setQuickLogMood(Number(e.target.value))}
                className="w-full mt-4 accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>Terrible</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={quickLogNotes}
                onChange={(e) => setQuickLogNotes(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsQuickLogOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickLog}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Log Mood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

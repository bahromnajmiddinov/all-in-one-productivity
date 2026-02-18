import { useState, useEffect } from 'react';
import { moodApi } from '../api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../components/ui/Dialog';
import { Skeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import type {
  MoodEntry,
  MoodStats,
  MoodInsight,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Smile,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Lightbulb,
  X,
  Plus,
  BarChart3,
  Target,
  Zap,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const TIME_PERIODS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '3 Months' },
  { value: 365, label: 'Year' },
];

export default function Mood() {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'patterns' | 'emotions' | 'insights'>('overview');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [insights, setInsights] = useState<MoodInsight[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogMood, setQuickLogMood] = useState(5);
  const [quickLogNotes, setQuickLogNotes] = useState('');
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, statsRes, insightsRes, timelineRes] = await Promise.all([
        moodApi.getEntries({ start_date: new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
        moodApi.getStats(),
        moodApi.getInsights(),
        moodApi.getTimeline(selectedPeriod),
      ]);

      setEntries(entriesRes.data.results || entriesRes.data);
      setStats(statsRes.data);
      setInsights(insightsRes.data.results || insightsRes.data);
      setTimelineData(timelineRes.data.timeline || []);
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <TrendingDown className="w-6 h-6 text-destructive" />;
      case 'achievement':
        return <TrendingUp className="w-6 h-6 text-success" />;
      case 'pattern':
        return <Target className="w-6 h-6 text-accent" />;
      default:
        return <Lightbulb className="w-6 h-6 text-warning" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-destructive-subtle border-destructive/20';
      case 'achievement':
        return 'bg-success-subtle border-success/20';
      case 'pattern':
        return 'bg-accent-subtle border-accent/20';
      default:
        return 'bg-warning-subtle border-warning/20';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'timeline', label: 'Timeline', icon: TrendingUp },
    { id: 'patterns', label: 'Patterns', icon: Target },
    { id: 'emotions', label: 'Emotions', icon: Smile },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
  ];

  if (isLoading) {
    return (
      <div className="page-container space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <StatCardSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-[var(--radius)] bg-accent-subtle text-accent">
              <Heart className="w-5 h-5" />
            </div>
            <h1 className="text-h1">Mood Tracking</h1>
          </div>
          <p className="text-body max-w-2xl">
            Track, analyze, and understand your emotional well-being. Log your mood daily 
            to discover patterns and improve your mental health.
          </p>
        </div>
        <Button onClick={() => setIsQuickLogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Log Mood
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-accent-subtle text-accent">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-body-sm text-fg-muted">Current Streak</span>
            </div>
            <p className="text-metric">{stats?.current_streak || 0} <span className="text-body font-normal text-fg-muted">days</span></p>
            <p className="text-caption mt-1">Best: {stats?.best_streak || 0} days</p>
          </CardContent>
        </Card>

        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-success-subtle text-success">
                <Smile className="w-5 h-5" />
              </div>
              <span className="text-body-sm text-fg-muted">7-Day Average</span>
            </div>
            <p className="text-metric">{stats?.avg_mood_7d?.toFixed(1) || '-'}</p>
            <p className="text-caption mt-1">30-day: {stats?.avg_mood_30d?.toFixed(1) || '-'}</p>
          </CardContent>
        </Card>

        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-warning-subtle text-warning">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-body-sm text-fg-muted">Total Entries</span>
            </div>
            <p className="text-metric">{stats?.total_entries || 0}</p>
            <p className="text-caption mt-1">This period: {entries.length}</p>
          </CardContent>
        </Card>

        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-success-subtle text-success">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-body-sm text-fg-muted">Top Emotion</span>
            </div>
            <p className="text-metric capitalize">{stats?.top_emotions?.[0]?.emotion || '-'}</p>
            <p className="text-caption mt-1">{stats?.top_emotions?.[0]?.count || 0} times</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-fast',
                activeTab === tab.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-fg-muted hover:text-foreground hover:border-border'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Time Period Selector */}
      <div className="flex flex-wrap gap-2">
        {TIME_PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-[var(--radius-sm)] transition-fast',
              selectedPeriod === period.value
                ? 'bg-foreground text-background font-medium'
                : 'bg-bg-subtle text-fg-muted hover:text-foreground hover:bg-bg-hover'
            )}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Mood Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Mood Timeline</CardTitle>
                <CardDescription>Your mood changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        stroke="hsl(var(--fg-muted))"
                        fontSize={12}
                      />
                      <YAxis domain={[0, 10]} stroke="hsl(var(--fg-muted))" fontSize={12} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--bg-elevated))', 
                          borderRadius: 'var(--radius)', 
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--fg))'
                        }}
                        formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : value, 'Mood']}
                        labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                      />
                      <Line
                        type="monotone"
                        dataKey="mood_value"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      {timelineData.some(d => d.rolling_avg_7d) && (
                        <Line
                          type="monotone"
                          dataKey="rolling_avg_7d"
                          stroke="hsl(var(--success))"
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
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <span className="text-fg-muted">Daily Mood</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="text-fg-muted">7-Day Average</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>How often you feel each mood level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(stats?.mood_distribution || {}).map(([value, count]) => ({
                          value: Number(value),
                          count,
                          label: `${value} ${getMoodEmoji(Number(value))}`,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="value" stroke="hsl(var(--fg-muted))" fontSize={12} />
                        <YAxis stroke="hsl(var(--fg-muted))" fontSize={12} />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--bg-elevated))', 
                            borderRadius: 'var(--radius)', 
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--fg))'
                          }}
                          formatter={(value) => [value, 'Entries']}
                        />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Time of Day Averages */}
              <Card>
                <CardHeader>
                  <CardTitle>Mood by Time of Day</CardTitle>
                  <CardDescription>When you feel your best</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={Object.entries(stats?.time_of_day_averages || {}).map(([time, avg]) => ({
                          time: time.charAt(0).toUpperCase() + time.slice(1),
                          avg: Number(avg.toFixed(1)),
                          fullMark: 10,
                        }))}
                      >
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="time" tick={{ fill: 'hsl(var(--fg-muted))', fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'hsl(var(--fg-muted))', fontSize: 10 }} />
                        <Radar
                          name="Average Mood"
                          dataKey="avg"
                          stroke="hsl(var(--accent))"
                          fill="hsl(var(--accent))"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Active Insights */}
            <div className="space-y-4">
              {insights.length === 0 ? (
                <EmptyState
                  icon={<Lightbulb className="w-12 h-12" strokeWidth={1} />}
                  title="No insights yet"
                  description="Keep logging your mood to receive personalized insights."
                />
              ) : (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      'rounded-[var(--radius)] p-6 border-2',
                      getInsightBg(insight.insight_type)
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-[var(--radius)] bg-bg-elevated">
                          {getInsightIcon(insight.insight_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-h4">{insight.title}</h3>
                          <p className="text-body mt-1">{insight.description}</p>
                          
                          {insight.action_items && insight.action_items.length > 0 && (
                            <div className="mt-3">
                              <p className="text-body-sm font-medium text-foreground">Suggested Actions:</p>
                              <ul className="mt-1 space-y-1">
                                {insight.action_items.map((action, idx) => (
                                  <li key={idx} className="text-body-sm text-fg-muted flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-caption text-fg-muted">
                            <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                            <span>{format(new Date(insight.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissInsight(insight.id)}
                        className="text-fg-subtle hover:text-foreground p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Factors Impact */}
            {(stats?.top_positive_factors?.length || stats?.top_negative_factors?.length) ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Positive Factors</CardTitle>
                    <CardDescription>What improves your mood</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats?.top_positive_factors?.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-success-subtle rounded-[var(--radius-sm)]">
                          <span className="font-medium text-foreground capitalize">{factor.category}</span>
                          <span className="text-success font-semibold">+{factor.impact}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Negative Factors</CardTitle>
                    <CardDescription>What brings your mood down</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats?.top_negative_factors?.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-destructive-subtle rounded-[var(--radius-sm)]">
                          <span className="font-medium text-foreground capitalize">{factor.category}</span>
                          <span className="text-destructive font-semibold">{factor.impact}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        )}

        {/* Other tabs content would go here */}
        {(activeTab === 'timeline' || activeTab === 'patterns' || activeTab === 'emotions') && (
          <EmptyState
            icon={<BarChart3 className="w-12 h-12" strokeWidth={1} />}
            title="Coming Soon"
            description="This feature is under development. Check back later!"
          />
        )}
      </div>

      {/* Quick Log Modal - Using Proper Dialog Component */}
      <Dialog open={isQuickLogOpen} onOpenChange={setIsQuickLogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
          </DialogHeader>
          
          <DialogBody className="space-y-6">
            {/* Mood Display */}
            <div className="text-center">
              <div className="text-6xl mb-2">{getMoodEmoji(quickLogMood)}</div>
              <div className="text-metric">{quickLogMood}<span className="text-body font-normal text-fg-muted">/10</span></div>
              <input
                type="range"
                min="1"
                max="10"
                value={quickLogMood}
                onChange={(e) => setQuickLogMood(Number(e.target.value))}
                className="w-full mt-4 accent-accent"
              />
              <div className="flex justify-between text-caption text-fg-muted mt-2">
                <span>Terrible</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Notes (optional)
              </label>
              <textarea
                value={quickLogNotes}
                onChange={(e) => setQuickLogNotes(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 border border-border bg-background rounded-[var(--radius-sm)] text-sm text-foreground placeholder:text-fg-subtle focus:outline-none focus:border-border-hover focus:ring-2 focus:ring-ring/20 resize-none"
                rows={3}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsQuickLogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickLog}>
              Log Mood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

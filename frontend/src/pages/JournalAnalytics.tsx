import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Heart, Calendar, BookOpen, Flame, BarChart3 } from 'lucide-react';
import { journalApi } from '../api';
import type { JournalStats, JournalStreak } from '../types';

export function JournalAnalytics() {
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [streak, setStreak] = useState<JournalStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, streakRes] = await Promise.all([
        journalApi.getStatsDashboard(),
        journalApi.getMyStreak(),
      ]);
      setStats(statsRes.data);
      setStreak(streakRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getMoodEmoji = (mood?: number) => {
    if (!mood) return '😐';
    switch (Math.round(mood)) {
      case 5: return '😄';
      case 4: return '🙂';
      case 3: return '😐';
      case 2: return '😔';
      case 1: return '😞';
      default: return '😐';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-fg-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/journal"
            className="flex items-center gap-2 text-fg-muted hover:text-foreground transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Journal
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Journal Analytics</h1>
        </div>
      </div>

      {stats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-bg-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-fg-muted">Total Entries</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total_entries}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-bg-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-fg-muted">Total Words</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total_word_count.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-bg-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-fg-muted">Current Streak</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.current_streak} days</p>
                </div>
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-bg-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-fg-muted">Consistency Score</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.consistency_score}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Writing Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-lg border border-border bg-bg-elevated">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                This Month
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-fg-muted">Entries this month</span>
                    <span className="font-semibold text-foreground">{stats.entries_this_month}</span>
                  </div>
                  <div className="w-full bg-bg-subtle rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (stats.entries_this_month / 30) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-fg-muted">Entries this week</span>
                    <span className="font-semibold text-foreground">{stats.entries_this_week}</span>
                  </div>
                  <div className="w-full bg-bg-subtle rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (stats.entries_this_week / 7) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-fg-muted">Average entries/week</span>
                    <span className="font-semibold text-foreground">{stats.avg_entries_per_week}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-bg-elevated">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Mood Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg">
                  <div>
                    <p className="text-sm text-fg-muted">Average Mood</p>
                    <p className="text-lg font-semibold text-foreground">
                      {getMoodEmoji(stats.avg_mood)} {stats.avg_mood?.toFixed(1) || '-'}
                    </p>
                  </div>
                  <div className="text-3xl">
                    {getTrendIcon(stats.mood_trend)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-fg-muted mb-2">Mood Trend</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {stats.mood_trend}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-fg-muted mb-2">Writing Velocity</p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {stats.writing_velocity}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags and Best Streak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-lg border border-border bg-bg-elevated">
              <h3 className="text-lg font-semibold text-foreground mb-4">Most Used Tags</h3>
              {stats.most_used_tags && stats.most_used_tags.length > 0 ? (
                <div className="space-y-2">
                  {stats.most_used_tags.map((tag, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-foreground">{tag.name}</span>
                      </div>
                      <span className="text-sm text-fg-muted">{tag.count} entries</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-fg-muted">No tags used yet</p>
              )}
            </div>

            <div className="p-6 rounded-lg border border-border bg-bg-elevated">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Best Streak
              </h3>
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-foreground">{stats.longest_streak}</p>
                <p className="text-fg-muted mt-2">consecutive days</p>
              </div>
              {stats.most_productive_day && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-fg-muted">Most Productive Day</p>
                  <p className="text-lg font-semibold text-foreground">{stats.most_productive_day}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-bg-elevated rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.avg_word_count}</p>
              <p className="text-sm text-fg-muted">Avg Words/Entry</p>
            </div>
            <div className="p-4 bg-bg-elevated rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.entries_this_week}</p>
              <p className="text-sm text-fg-muted">This Week</p>
            </div>
            <div className="p-4 bg-bg-elevated rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.entries_this_month}</p>
              <p className="text-sm text-fg-muted">This Month</p>
            </div>
            <div className="p-4 bg-bg-elevated rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-foreground">{stats.entries_this_year}</p>
              <p className="text-sm text-fg-muted">This Year</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

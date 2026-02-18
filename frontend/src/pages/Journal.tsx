import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { journalApi } from '../api';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import { Plus, BookOpen, Calendar, TrendingUp, Heart, BarChart3, Flame, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import type { JournalEntry, JournalStreak, JournalStats } from '../types';

export function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState<JournalStreak | null>(null);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesRes, streakRes, statsRes] = await Promise.all([
        journalApi.getEntries({ favorites: filterFavorites }),
        journalApi.getMyStreak(),
        journalApi.getStatsDashboard(),
      ]);
      setEntries(entriesRes.data.results || entriesRes.data);
      setStreak(streakRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const res = await journalApi.searchEntries({ q: query });
        setEntries(res.data.results || res.data);
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      loadData();
    }
  };

  const toggleFavorite = async (entryId: string) => {
    try {
      await journalApi.favoriteEntry(entryId);
      loadData();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getSentimentColor = (label?: string) => {
    switch (label) {
      case 'positive': return 'text-success bg-success-subtle border-success/20';
      case 'negative': return 'text-destructive bg-destructive-subtle border-destructive/20';
      default: return 'text-fg-muted bg-bg-subtle border-border';
    }
  };

  const getMoodEmoji = (mood?: number) => {
    if (!mood) return '😐';
    switch (mood) {
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
      <div className="page-container space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
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
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-[var(--radius)] bg-accent-subtle text-accent">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-h1">Journal</h1>
          </div>
          <p className="text-body max-w-2xl">
            Capture your thoughts and reflect on your journey. Track your mood, 
            sentiment, and writing habits over time.
          </p>
        </div>
        <Link to="/journal/new">
          <Button>
            <Plus className="w-4 h-4 mr-1.5" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-warning-subtle text-warning">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <p className="text-caption text-fg-muted">Current Streak</p>
            <p className="text-metric mt-1">{streak?.current_streak || 0} <span className="text-body font-normal text-fg-muted">days</span></p>
            {streak && streak.days_this_month > 0 && (
              <p className="text-caption mt-1">{streak.days_this_month} entries this month</p>
            )}
          </CardContent>
        </Card>

        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-accent-subtle text-accent">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-caption text-fg-muted">Total Entries</p>
            <p className="text-metric mt-1">{stats?.total_entries || 0}</p>
            {stats && stats.total_word_count > 0 && (
              <p className="text-caption mt-1">{stats.total_word_count.toLocaleString()} words written</p>
            )}
          </CardContent>
        </Card>

        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-success-subtle text-success">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-caption text-fg-muted">Consistency</p>
            <p className="text-metric mt-1">{stats?.consistency_score || 0}%</p>
            {stats && (
              <p className="text-caption mt-1">Best streak: {stats.longest_streak} days</p>
            )}
          </CardContent>
        </Card>

        <Card isHoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-[var(--radius)] bg-destructive-subtle text-destructive">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-caption text-fg-muted">Average Mood</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-metric">{stats?.avg_mood?.toFixed(1) || '-'}</span>
              <span className="text-xl">{getMoodEmoji(stats?.avg_mood ? Math.round(stats.avg_mood) : undefined)}</span>
            </div>
            {stats?.mood_trend && (
              <p className="text-caption mt-1 capitalize">Trend: {stats.mood_trend}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
          <input
            type="search"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-sm)] border border-border bg-background text-foreground placeholder:text-fg-subtle focus:outline-none focus:border-border-hover focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterFavorites ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setFilterFavorites(!filterFavorites);
              loadData();
            }}
          >
            <Heart className={cn('w-4 h-4 mr-1.5', filterFavorites && 'fill-current')} />
            Favorites
          </Button>
          <Link to="/journal/analytics">
            <Button variant="secondary" size="sm">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Entries Grid */}
      {entries.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" strokeWidth={1} />}
          title="No journal entries yet"
          description="Start writing your first entry to begin your journaling journey"
          action={
            <Link to="/journal/new">
              <Button>
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Entry
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`/journal/${entry.id}`}
              className="group block"
            >
              <Card isHoverable className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-fg-subtle" />
                        <span className="text-caption">
                          {new Date(entry.entry_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {entry.title && (
                        <h3 className="text-body font-semibold text-foreground line-clamp-2">{entry.title}</h3>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(entry.id);
                      }}
                      className={cn(
                        'p-1.5 rounded-[var(--radius-sm)] transition-fast flex-shrink-0',
                        entry.is_favorite
                          ? 'text-destructive bg-destructive-subtle'
                          : 'text-fg-subtle hover:text-destructive hover:bg-destructive-subtle opacity-0 group-hover:opacity-100'
                      )}
                    >
                      <Heart className={cn('w-4 h-4', entry.is_favorite && 'fill-current')} />
                    </button>
                  </div>

                  <p className="text-body-sm text-fg-muted line-clamp-3 mb-3">{entry.content}</p>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {entry.mood && (
                        <span className="text-lg" title={`Mood: ${entry.mood.mood}/5`}>
                          {getMoodEmoji(entry.mood.mood)}
                        </span>
                      )}
                      <span className="text-caption">
                        {entry.word_count} words
                      </span>
                      {entry.sentiment_label && (
                        <span className={cn('px-2 py-0.5 rounded-full text-caption border', getSentimentColor(entry.sentiment_label))}>
                          {entry.sentiment_label}
                        </span>
                      )}
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 rounded-full text-caption text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {entry.tags.length > 2 && (
                          <span className="text-caption text-fg-muted">+{entry.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/journal/timeline', icon: Calendar, title: 'Timeline', desc: 'Browse by date' },
          { to: '/journal/memory-lane', icon: TrendingUp, title: 'Memory Lane', desc: 'Past reflections' },
          { to: '/journal/templates', icon: BookOpen, title: 'Templates', desc: 'Quick start guides' },
          { to: '/journal/prompts', icon: Filter, title: 'Prompts', desc: 'Writing ideas' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group"
          >
            <Card isHoverable className="text-center">
              <CardContent className="p-5">
                <item.icon className="w-6 h-6 mx-auto mb-2 text-fg-muted group-hover:text-foreground transition-fast" />
                <p className="text-body-sm font-medium text-foreground">{item.title}</p>
                <p className="text-caption text-fg-muted">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

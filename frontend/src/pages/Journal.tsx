import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Calendar, TrendingUp, Heart, BarChart3, Flame, Search, Filter } from 'lucide-react';
import { journalApi } from '../api';
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
      case 'positive': return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
      case 'negative': return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
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
      <div className="flex items-center justify-center h-96">
        <div className="text-fg-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Journal</h1>
          <p className="text-fg-muted mt-1">Capture your thoughts and reflect on your journey</p>
        </div>
        <Link
          to="/journal/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="p-4 rounded-lg border border-border bg-bg-elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg-muted">Current Streak</p>
              <p className="text-2xl font-bold text-foreground mt-1">{streak?.current_streak || 0} days</p>
            </div>
            <Flame className="w-8 h-8 text-orange-500" />
          </div>
          {streak && streak.days_this_month > 0 && (
            <p className="text-xs text-fg-muted mt-2">
              {streak.days_this_month} entries this month
            </p>
          )}
        </div>

        {/* Total Entries */}
        <div className="p-4 rounded-lg border border-border bg-bg-elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg-muted">Total Entries</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.total_entries || 0}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          {stats && stats.total_word_count > 0 && (
            <p className="text-xs text-fg-muted mt-2">
              {stats.total_word_count.toLocaleString()} words written
            </p>
          )}
        </div>

        {/* Consistency */}
        <div className="p-4 rounded-lg border border-border bg-bg-elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg-muted">Consistency</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.consistency_score || 0}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          {stats && (
            <p className="text-xs text-fg-muted mt-2">
              Best streak: {stats.longest_streak} days
            </p>
          )}
        </div>

        {/* Avg Mood */}
        <div className="p-4 rounded-lg border border-border bg-bg-elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-fg-muted">Average Mood</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{getMoodEmoji(stats?.avg_mood ? Math.round(stats.avg_mood) : undefined)}</span>
                <span className="text-2xl font-bold text-foreground">{stats?.avg_mood?.toFixed(1) || '-'}</span>
              </div>
            </div>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          {stats?.mood_trend && (
            <p className="text-xs text-fg-muted mt-2 capitalize">
              Trend: {stats.mood_trend}
            </p>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
          <input
            type="search"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-fg-muted"
          />
        </div>
        <button
          onClick={() => {
            setFilterFavorites(!filterFavorites);
            loadData();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-smooth ${
            filterFavorites
              ? 'bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-400'
              : 'border-border hover:bg-bg-subtle text-fg-muted'
          }`}
        >
          <Heart className={`w-4 h-4 ${filterFavorites ? 'fill-current' : ''}`} />
          Favorites
        </button>
        <Link
          to="/journal/analytics"
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-bg-subtle text-fg-muted transition-smooth"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Link>
      </div>

      {/* Entries Grid */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 mx-auto text-fg-muted mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No journal entries yet</h3>
          <p className="text-fg-muted mb-6">Start writing your first entry to begin your journaling journey</p>
          <Link
            to="/journal/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
          >
            <Plus className="w-4 h-4" />
            Create First Entry
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`/journal/${entry.id}`}
              className="block p-4 rounded-lg border border-border bg-bg-elevated hover:border-primary transition-smooth"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-fg-muted" />
                    <span className="text-sm text-fg-muted">
                      {new Date(entry.entry_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {entry.title && (
                    <h3 className="font-semibold text-foreground line-clamp-2">{entry.title}</h3>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(entry.id);
                  }}
                  className={`p-1 rounded transition-smooth ${
                    entry.is_favorite
                      ? 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950'
                      : 'text-fg-muted hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${entry.is_favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className="text-sm text-fg-muted line-clamp-3 mb-3">{entry.content}</p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {entry.mood && (
                    <span className="text-lg" title={`Mood: ${entry.mood.mood}/5`}>
                      {getMoodEmoji(entry.mood.mood)}
                    </span>
                  )}
                  <span className="text-fg-muted">
                    {entry.word_count} words
                  </span>
                  {entry.sentiment_label && (
                    <span className={`px-2 py-0.5 rounded ${getSentimentColor(entry.sentiment_label)}`}>
                      {entry.sentiment_label}
                    </span>
                  )}
                </div>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {entry.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 rounded text-xs text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {entry.tags.length > 2 && (
                      <span className="text-fg-muted">+{entry.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/journal/timeline"
          className="p-4 rounded-lg border border-border bg-bg-elevated hover:border-primary transition-smooth text-center"
        >
          <Calendar className="w-6 h-6 mx-auto mb-2 text-fg-muted" />
          <p className="text-sm font-medium text-foreground">Timeline</p>
          <p className="text-xs text-fg-muted">Browse by date</p>
        </Link>
        <Link
          to="/journal/memory-lane"
          className="p-4 rounded-lg border border-border bg-bg-elevated hover:border-primary transition-smooth text-center"
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-fg-muted" />
          <p className="text-sm font-medium text-foreground">Memory Lane</p>
          <p className="text-xs text-fg-muted">Past reflections</p>
        </Link>
        <Link
          to="/journal/templates"
          className="p-4 rounded-lg border border-border bg-bg-elevated hover:border-primary transition-smooth text-center"
        >
          <BookOpen className="w-6 h-6 mx-auto mb-2 text-fg-muted" />
          <p className="text-sm font-medium text-foreground">Templates</p>
          <p className="text-xs text-fg-muted">Quick start guides</p>
        </Link>
        <Link
          to="/journal/prompts"
          className="p-4 rounded-lg border border-border bg-bg-elevated hover:border-primary transition-smooth text-center"
        >
          <Filter className="w-6 h-6 mx-auto mb-2 text-fg-muted" />
          <p className="text-sm font-medium text-foreground">Prompts</p>
          <p className="text-xs text-fg-muted">Writing ideas</p>
        </Link>
      </div>
    </div>
  );
}

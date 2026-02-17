import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Heart, Calendar, Tag as TagIcon, BarChart2, Save, X } from 'lucide-react';
import { journalApi } from '../api';
import type { JournalEntry, JournalMood, JournalTag } from '../types';

export function JournalEntryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      const res = await journalApi.getEntry(id!);
      const data = res.data;
      setEntry(data);
      setTitle(data.title || '');
      setContent(data.content);
      setSelectedTags(data.tags?.map((t: JournalTag) => t.id) || []);
    } catch (error) {
      console.error('Failed to load entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entry) return;

    try {
      setSaving(true);
      await journalApi.partialUpdateEntry(entry.id, {
        title,
        content,
        tags: selectedTags,
      });
      setIsEditing(false);
      loadEntry();
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;

    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await journalApi.deleteEntry(entry.id);
        navigate('/journal');
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  const toggleFavorite = async () => {
    if (!entry) return;

    try {
      await journalApi.favoriteEntry(entry.id);
      loadEntry();
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

  if (!entry) {
    return (
      <div className="text-center py-16">
        <p className="text-fg-muted">Entry not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/journal"
          className="flex items-center gap-2 text-fg-muted hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </Link>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-lg transition-smooth ${
                  entry.is_favorite
                    ? 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950'
                    : 'text-fg-muted hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950'
                }`}
                title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-5 h-5 ${entry.is_favorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-bg-subtle text-foreground transition-smooth"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-smooth"
                title="Delete entry"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTitle(entry.title || '');
                  setContent(entry.content);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-bg-subtle text-foreground transition-smooth"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title..."
              className="w-full px-4 py-2 text-2xl font-bold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts..."
              rows={20}
              className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-y"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-fg-muted">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(entry.entry_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {entry.title && (
              <h1 className="text-3xl font-bold text-foreground">{entry.title}</h1>
            )}

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {entry.content}
              </div>
            </div>

            {entry.mood && (
              <div className="flex items-center gap-2 p-4 bg-bg-elevated rounded-lg border border-border">
                <span className="text-3xl">{getMoodEmoji(entry.mood.mood)}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Mood: {entry.mood.mood}/5 - {entry.mood.mood === 5 ? 'Amazing' : entry.mood.mood === 4 ? 'Good' : entry.mood.mood === 3 ? 'Okay' : entry.mood.mood === 2 ? 'Bad' : 'Terrible'}
                  </p>
                  {(entry.mood.energy_level || entry.mood.stress_level || entry.mood.sleep_quality) && (
                    <p className="text-xs text-fg-muted mt-1">
                      {entry.mood.energy_level && `Energy: ${entry.mood.energy_level}/10`}
                      {entry.mood.energy_level && entry.mood.stress_level && ' • '}
                      {entry.mood.stress_level && `Stress: ${entry.mood.stress_level}/10`}
                      {(entry.mood.energy_level || entry.mood.stress_level) && entry.mood.sleep_quality && ' • '}
                      {entry.mood.sleep_quality && `Sleep: ${entry.mood.sleep_quality}/10`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {entry.keywords && entry.keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {entry.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-bg-subtle text-fg-muted rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between pt-6 border-t border-border text-sm text-fg-muted">
          <div className="flex items-center gap-4">
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                <div className="flex items-center gap-1">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 rounded text-xs text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>{entry.word_count} words</span>
            {entry.sentiment_label && (
              <span className={`px-2 py-0.5 rounded ${getSentimentColor(entry.sentiment_label)}`}>
                {entry.sentiment_label}
              </span>
            )}
            <span>
              Updated {new Date(entry.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Related Analytics */}
      {entry.analytics && (
        <div className="p-4 bg-bg-elevated rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Entry Analytics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-fg-muted">Word Count</p>
              <p className="text-lg font-semibold text-foreground">{entry.analytics.word_count}</p>
            </div>
            <div>
              <p className="text-fg-muted">Reading Time</p>
              <p className="text-lg font-semibold text-foreground">{entry.analytics.reading_time_minutes} min</p>
            </div>
            <div>
              <p className="text-fg-muted">Views</p>
              <p className="text-lg font-semibold text-foreground">{entry.analytics.view_count}</p>
            </div>
            <div>
              <p className="text-fg-muted">Edits</p>
              <p className="text-lg font-semibold text-foreground">{entry.analytics.edit_count}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

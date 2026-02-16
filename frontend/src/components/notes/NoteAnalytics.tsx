import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { FileText, Eye, Edit3, Link2, Hash, TrendingUp, Clock, Calendar } from 'lucide-react';
import type { GlobalNoteAnalytics, NoteAnalytics as NoteAnalyticsType } from '../../types/notes';

interface Props {
  noteId?: string;
}

export function NoteAnalytics({ noteId }: Props) {
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalNoteAnalytics | null>(null);
  const [noteAnalytics, setNoteAnalytics] = useState<NoteAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [noteId]);

  const loadAnalytics = async () => {
    try {
      if (noteId) {
        const response = await notesApi.getNoteAnalytics(noteId);
        setNoteAnalytics(response.data);
      } else {
        const response = await notesApi.getAnalytics();
        setGlobalAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bg-elevated rounded-lg border border-border p-6">
        <div className="text-fg-subtle">Loading analytics...</div>
      </div>
    );
  }

  // Single note analytics view
  if (noteAnalytics) {
    return (
      <div className="bg-bg-elevated rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" strokeWidth={1.5} />
          Note Statistics
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={FileText}
            label="Words"
            value={noteAnalytics.word_count.toLocaleString()}
          />
          <StatCard
            icon={Clock}
            label="Reading Time"
            value={`${noteAnalytics.reading_time_minutes} min`}
          />
          <StatCard
            icon={Eye}
            label="Views"
            value={noteAnalytics.view_count.toLocaleString()}
          />
          <StatCard
            icon={Edit3}
            label="Edits"
            value={noteAnalytics.edit_count.toLocaleString()}
          />
          <StatCard
            icon={Link2}
            label="Outgoing Links"
            value={noteAnalytics.outgoing_link_count.toString()}
          />
          <StatCard
            icon={Hash}
            label="Incoming Links"
            value={noteAnalytics.incoming_link_count.toString()}
          />
        </div>

        {(noteAnalytics.first_viewed_at || noteAnalytics.last_viewed_at) && (
          <div className="pt-3 border-t border-border space-y-2 text-sm">
            {noteAnalytics.first_viewed_at && (
              <div className="flex items-center justify-between text-fg-subtle">
                <span className="flex items-center gap-1.5">
                  <Eye className="size-4" strokeWidth={1.5} />
                  First viewed
                </span>
                <span>{new Date(noteAnalytics.first_viewed_at).toLocaleDateString()}</span>
              </div>
            )}
            {noteAnalytics.last_viewed_at && (
              <div className="flex items-center justify-between text-fg-subtle">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" strokeWidth={1.5} />
                  Last viewed
                </span>
                <span>{new Date(noteAnalytics.last_viewed_at).toLocaleDateString()}</span>
              </div>
            )}
            {noteAnalytics.last_edited_at && (
              <div className="flex items-center justify-between text-fg-subtle">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="size-4" strokeWidth={1.5} />
                  Last edited
                </span>
                <span>{new Date(noteAnalytics.last_edited_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Global analytics view
  if (!globalAnalytics) {
    return (
      <div className="bg-bg-elevated rounded-lg border border-border p-6">
        <div className="text-fg-subtle">No analytics available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={FileText}
          label="Total Notes"
          value={globalAnalytics.total_notes.toLocaleString()}
        />
        <StatCard
          icon={Hash}
          label="Total Words"
          value={globalAnalytics.total_words.toLocaleString()}
        />
        <StatCard
          icon={Calendar}
          label="This Week"
          value={globalAnalytics.notes_this_week.toString()}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={globalAnalytics.notes_this_month.toString()}
        />
      </div>

      {/* Most Used Tags */}
      {globalAnalytics.most_used_tags.length > 0 && (
        <div className="bg-bg-elevated rounded-lg border border-border p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Hash className="size-5 text-primary" strokeWidth={1.5} />
            Most Used Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {globalAnalytics.most_used_tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-bg-subtle rounded-full text-sm"
              >
                {tag.name}
                <span className="text-fg-subtle ml-1.5">({tag.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Most Linked Notes */}
      {globalAnalytics.most_linked_notes.length > 0 && (
        <div className="bg-bg-elevated rounded-lg border border-border p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Link2 className="size-5 text-primary" strokeWidth={1.5} />
            Most Referenced Notes
          </h3>
          <div className="space-y-2">
            {globalAnalytics.most_linked_notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-2.5 bg-bg-subtle rounded-lg"
              >
                <span className="text-sm truncate flex-1">{note.title}</span>
                <span className="text-xs text-fg-subtle ml-3">
                  {note.link_count} links
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creation Trend */}
      {globalAnalytics.daily_creation_trend.length > 0 && (
        <div className="bg-bg-elevated rounded-lg border border-border p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-primary" strokeWidth={1.5} />
            Creation Trend (Last 30 Days)
          </h3>
          <div className="h-32 flex items-end gap-1">
            {globalAnalytics.daily_creation_trend.map((day, i) => {
              const maxCount = Math.max(...globalAnalytics.daily_creation_trend.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${day.date}: ${day.count} notes`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-foreground text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.count} on {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {globalAnalytics.most_active_day && (
        <div className="bg-bg-elevated rounded-lg border border-border p-5">
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-primary" strokeWidth={1.5} />
            <div>
              <div className="text-sm text-fg-subtle">Most Active Day</div>
              <div className="font-medium">
                {new Date(globalAnalytics.most_active_day).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="bg-bg-subtle rounded-lg p-3 flex items-center gap-3">
      <div className="p-2 bg-bg-elevated rounded-lg">
        <Icon className="size-4 text-primary" strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-fg-subtle">{label}</div>
      </div>
    </div>
  );
}

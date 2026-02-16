import { useState } from 'react';
import { Link2, ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import type { Backlink, NoteLink } from '../../types/notes';

interface Props {
  outgoingLinks: NoteLink[];
  backlinks: Backlink[];
  allNotes: { id: string; title: string }[];
  currentNoteId: string;
  onAddLink: (targetNoteId: string) => void;
  onRemoveLink: (targetNoteId: string) => void;
  onNavigate: (noteId: string) => void;
}

export function BacklinksPanel({
  outgoingLinks,
  backlinks,
  allNotes,
  currentNoteId,
  onAddLink,
  onRemoveLink,
  onNavigate,
}: Props) {
  const [showAddLink, setShowAddLink] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState('');

  const handleAddLink = () => {
    if (selectedNoteId) {
      onAddLink(selectedNoteId);
      setSelectedNoteId('');
      setShowAddLink(false);
    }
  };

  // Filter out already linked notes and current note
  const availableNotes = allNotes.filter(
    note => note.id !== currentNoteId && !outgoingLinks.some(link => link.target_note_id === note.id)
  );

  return (
    <div className="bg-bg-elevated rounded-lg border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Link2 className="size-5 text-primary" strokeWidth={1.5} />
          Connections
        </h3>
        {availableNotes.length > 0 && (
          <button
            onClick={() => setShowAddLink(!showAddLink)}
            className="p-1.5 hover:bg-bg-subtle rounded-lg transition-colors"
            title="Add link"
          >
            <Plus className="size-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Add Link Form */}
      {showAddLink && availableNotes.length > 0 && (
        <div className="flex gap-2 p-3 bg-bg-subtle rounded-lg">
          <select
            value={selectedNoteId}
            onChange={(e) => setSelectedNoteId(e.target.value)}
            className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Select a note...</option>
            {availableNotes.map(note => (
              <option key={note.id} value={note.id}>{note.title}</option>
            ))}
          </select>
          <button
            onClick={handleAddLink}
            disabled={!selectedNoteId}
            className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Outgoing Links */}
      {outgoingLinks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-fg-subtle flex items-center gap-1.5 mb-2">
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
            Links to ({outgoingLinks.length})
          </h4>
          <div className="space-y-1">
            {outgoingLinks.map(link => (
              <div
                key={link.id}
                className="group flex items-center justify-between p-2.5 bg-bg-subtle rounded-lg hover:bg-bg-subtle/80 transition-colors"
              >
                <button
                  onClick={() => onNavigate(link.target_note_id)}
                  className="flex-1 text-left text-sm truncate hover:text-primary transition-colors"
                >
                  {link.target_note_title}
                </button>
                <button
                  onClick={() => onRemoveLink(link.target_note)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                  title="Remove link"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-fg-subtle flex items-center gap-1.5 mb-2">
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
            Linked from ({backlinks.length})
          </h4>
          <div className="space-y-1">
            {backlinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.source_note_id)}
                className="w-full text-left p-2.5 bg-bg-subtle rounded-lg hover:bg-bg-subtle/80 transition-colors"
              >
                <div className="text-sm truncate">{link.source_note_title}</div>
                {link.context && (
                  <div className="text-xs text-fg-subtle mt-1 line-clamp-2">{link.context}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {outgoingLinks.length === 0 && backlinks.length === 0 && (
        <div className="text-center py-4 text-fg-subtle text-sm">
          No connections yet.
          <br />
          Use [[Note Title]] in your content or add links above.
        </div>
      )}
    </div>
  );
}

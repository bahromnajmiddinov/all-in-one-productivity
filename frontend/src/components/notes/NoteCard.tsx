import { Link } from 'react-router-dom';
import type { NoteListItem } from '../../types/notes';

interface Props {
  note: NoteListItem;
  onPin: () => void;
  onFavorite: () => void;
  onArchive: () => void;
}

export function NoteCard({ note, onPin, onFavorite, onArchive }: Props) {
  return (
    <Link
      to={`/notes/${note.id}`}
      className={`block bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
        note.is_pinned ? 'border-yellow-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {note.is_pinned && <span className="text-yellow-500">📌</span>}
            <h4 className="font-semibold">{note.title}</h4>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{note.preview}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            {note.folder_name && (
              <span className="bg-gray-100 px-2 py-0.5 rounded">{note.folder_name}</span>
            )}
            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
          <button
            onClick={(e) => {
              e.preventDefault();
              onPin();
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            {note.is_pinned ? '📌' : '📍'}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite();
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {note.is_favorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onArchive();
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Archive"
          >
            🗑️
          </button>
        </div>
      </div>
    </Link>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notesApi } from '../api';
import { NoteEditor } from '../components/notes/NoteEditor';
import type { Note } from '../types/notes';

export function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadNote();
    }
  }, [id]);

  const loadNote = async () => {
    if (!id) return;
    
    try {
      const response = await notesApi.getNote(id);
      setNote(response.data);
    } catch (error) {
      console.error('Failed to load note', error);
      alert('Failed to load note');
      navigate('/notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notesApi.deleteNote(id);
      navigate('/notes');
    } catch (error) {
      console.error('Failed to delete note', error);
      alert('Failed to delete note');
    }
  };

  const handlePin = async () => {
    if (!id) return;
    
    try {
      await notesApi.pinNote(id);
      loadNote();
    } catch (error) {
      console.error('Failed to pin note', error);
    }
  };

  const handleFavorite = async () => {
    if (!id) return;
    
    try {
      await notesApi.favoriteNote(id);
      loadNote();
    } catch (error) {
      console.error('Failed to favorite note', error);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    
    try {
      await notesApi.archiveNote(id);
      navigate('/notes');
    } catch (error) {
      console.error('Failed to archive note', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-gray-500">Loading note...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-gray-500">Note not found</div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <button
            onClick={() => navigate('/notes')}
            className="text-blue-500 hover:text-blue-700"
          >
            ← Back to Notes
          </button>
        </div>
        <NoteEditor
          note={note}
          onSave={() => {
            setIsEditing(false);
            loadNote();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <button
          onClick={() => navigate('/notes')}
          className="text-blue-500 hover:text-blue-700"
        >
          ← Back to Notes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {note.is_pinned && <span className="text-yellow-500">📌</span>}
              {note.is_favorite && <span className="text-yellow-500">⭐</span>}
              <h1 className="text-3xl font-bold">{note.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {note.folder_info && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {note.folder_info.name}
                </span>
              )}
              {note.tags_info?.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              <span>
                Updated {new Date(note.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePin}
              className="px-3 py-1 border rounded hover:bg-gray-50"
              title={note.is_pinned ? 'Unpin' : 'Pin'}
            >
              {note.is_pinned ? '📌' : '📍'}
            </button>
            <button
              onClick={handleFavorite}
              className="px-3 py-1 border rounded hover:bg-gray-50"
              title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {note.is_favorite ? '⭐' : '☆'}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={handleArchive}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              Archive
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans">{note.content}</pre>
        </div>
      </div>
    </div>
  );
}

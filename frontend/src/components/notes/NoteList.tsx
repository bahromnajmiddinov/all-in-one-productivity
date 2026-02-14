import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { NoteCard } from './NoteCard';
import type { NoteListItem } from '../../types/notes';

interface Props {
  folderId?: string;
  tagId?: string;
  favorites?: boolean;
  searchQuery?: string;
  onRefresh?: () => void;
}

export function NoteList({ folderId, tagId, favorites, searchQuery, onRefresh }: Props) {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [folderId, tagId, favorites, searchQuery]);

  const loadNotes = async () => {
    try {
      const params: any = {};
      if (folderId) params.folder = folderId;
      if (tagId) params.tag = tagId;
      if (favorites) params.favorites = true;
      if (searchQuery) params.search = searchQuery;
      
      const response = await notesApi.getNotes(params);
      setNotes(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load notes', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (id: string) => {
    try {
      await notesApi.pinNote(id);
      loadNotes();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to pin note', error);
    }
  };

  const handleFavorite = async (id: string) => {
    try {
      await notesApi.favoriteNote(id);
      loadNotes();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to favorite note', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await notesApi.archiveNote(id);
      loadNotes();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to archive note', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No notes found</p>
      ) : (
        notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onPin={() => handlePin(note.id)}
            onFavorite={() => handleFavorite(note.id)}
            onArchive={() => handleArchive(note.id)}
          />
        ))
      )}
    </div>
  );
}

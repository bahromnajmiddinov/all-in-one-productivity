import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { NoteCard } from './NoteCard';
import type { NoteListItem } from '../../types/notes';

interface Props {
  folderId?: string;
  tagId?: string;
  searchQuery?: string;
  filterType?: 'all' | 'favorites' | 'recent' | 'archived';
  filters?: Record<string, any>;
  onRefresh?: () => void;
}

export function NoteList({ folderId, tagId, searchQuery, filterType = 'all', filters = {}, onRefresh }: Props) {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [folderId, tagId, searchQuery, filterType, JSON.stringify(filters)]);

  const loadNotes = async () => {
    try {
      const params: any = { ...filters };
      
      if (folderId) params.folder = folderId;
      if (tagId) params.tag = tagId;
      if (searchQuery) params.search = searchQuery;
      
      // Handle filter type
      if (filterType === 'favorites') {
        params.favorites = true;
      } else if (filterType === 'archived') {
        params.archived = 'true';
      }
      // 'recent' is handled by default ordering
      
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

  const handleRestore = async (id: string) => {
    try {
      await notesApi.restoreNote(id);
      loadNotes();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to restore note', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex items-center gap-3 text-fg-subtle">
          <div className="size-5 border-2 border-fg-subtle/30 border-t-fg-subtle rounded-full animate-spin" />
          Loading notes...
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="size-16 mx-auto mb-4 rounded-full bg-bg-subtle flex items-center justify-center">
          <svg className="size-8 text-fg-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">No notes found</h3>
        <p className="text-fg-subtle">
          {filterType === 'archived' 
            ? 'Your archive is empty.' 
            : filterType === 'favorites'
            ? 'No favorite notes yet.'
            : 'Start by creating your first note.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onPin={() => handlePin(note.id)}
          onFavorite={() => handleFavorite(note.id)}
          onArchive={() => handleArchive(note.id)}
          onRestore={filterType === 'archived' ? () => handleRestore(note.id) : undefined}
        />
      ))}
    </div>
  );
}

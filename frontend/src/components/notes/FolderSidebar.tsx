import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import type { NoteFolder } from '../../types/notes';

interface Props {
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderSidebar({ selectedFolder, onSelectFolder }: Props) {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await notesApi.getFolderTree();
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to load folders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-bg-subtle border-r border-border p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Folders</h3>
        <div className="text-sm text-fg-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-bg-subtle border-r border-border p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Folders</h3>
      
      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full text-left px-3 py-2 rounded mb-1 ${
          selectedFolder === null ? 'bg-bg-elevated text-foreground' : 'hover:bg-bg-elevated text-fg-muted'
        }`}
      >
        📄 All Notes
      </button>
      
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelectFolder(folder.id)}
          className={`w-full text-left px-3 py-2 rounded mb-1 flex items-center justify-between ${
            selectedFolder === folder.id ? 'bg-bg-elevated text-foreground' : 'hover:bg-bg-elevated text-fg-muted'
          }`}
        >
          <span>
            <span style={{ color: folder.color }}>📁</span> {folder.name}
          </span>
          <span className="text-xs text-fg-subtle">{folder.note_count}</span>
        </button>
      ))}
    </div>
  );
}

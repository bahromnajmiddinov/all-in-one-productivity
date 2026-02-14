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
      <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Folders</h3>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Folders</h3>
      
      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full text-left px-3 py-2 rounded mb-1 ${
          selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
        }`}
      >
        📄 All Notes
      </button>
      
      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelectFolder(folder.id)}
          className={`w-full text-left px-3 py-2 rounded mb-1 flex items-center justify-between ${
            selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
          }`}
        >
          <span>
            <span style={{ color: folder.color }}>📁</span> {folder.name}
          </span>
          <span className="text-xs text-gray-400">{folder.note_count}</span>
        </button>
      ))}
    </div>
  );
}

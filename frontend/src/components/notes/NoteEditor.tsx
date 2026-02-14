import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import type { Note, NoteFolder, NoteTag } from '../../types/notes';

interface Props {
  note?: Note;
  folderId?: string;
  onSave: () => void;
  onCancel?: () => void;
}

export function NoteEditor({ note, folderId, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [selectedFolder, setSelectedFolder] = useState(note?.folder || folderId || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(note?.tags || []);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFoldersAndTags();
  }, []);

  const loadFoldersAndTags = async () => {
    try {
      const [foldersRes, tagsRes] = await Promise.all([
        notesApi.getFolders(),
        notesApi.getTags(),
      ]);
      setFolders(foldersRes.data.results || foldersRes.data);
      setTags(tagsRes.data.results || tagsRes.data);
    } catch (error) {
      console.error('Failed to load folders/tags', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title,
        content,
        folder: selectedFolder || undefined,
        tags: selectedTags,
      };
      
      if (note) {
        await notesApi.updateNote(note.id, data);
      } else {
        await notesApi.createNote(data);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save note', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="w-full text-lg font-semibold border-b pb-2 mb-4 focus:outline-none focus:border-blue-500"
      />
      
      <div className="flex gap-4 mb-4 flex-wrap">
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>
        
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTags([...selectedTags, tag.id]);
                  } else {
                    setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                  }
                }}
                className="cursor-pointer"
              />
              <span style={{ color: tag.color }}>{tag.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        className="w-full h-64 resize-none border rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <div className="flex justify-end gap-2 mt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={saving}
        >
          {saving ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
        </button>
      </div>
    </div>
  );
}

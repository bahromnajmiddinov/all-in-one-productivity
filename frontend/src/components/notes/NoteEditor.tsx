import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { MarkdownEditor } from './MarkdownEditor';
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
  const [noteType, setNoteType] = useState(note?.note_type || 'text');
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
        note_type: noteType,
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
    <div className="bg-bg-elevated rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-bg-subtle">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-fg-muted"
        />
      </div>

      {/* Metadata */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Note Type */}
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as any)}
            className="px-3 py-2 bg-bg-subtle border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="text">📝 Text</option>
            <option value="markdown">✨ Markdown</option>
            <option value="checklist">☑️ Checklist</option>
            <option value="code">💻 Code</option>
            <option value="voice">🎤 Voice</option>
            <option value="web_clip">🌐 Web Clip</option>
          </select>

          {/* Folder */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-2 bg-bg-subtle border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">📁 No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-primary/10 text-primary'
                  : 'bg-bg-subtle text-fg-subtle hover:bg-bg-subtle/80'
              }`}
            >
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
                className="sr-only"
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </div>

      {/* Content Editor */}
      <div className="p-4">
        {noteType === 'markdown' ? (
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing in Markdown..."
            rows={12}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              noteType === 'checklist' 
                ? '- [ ] Task 1\n- [ ] Task 2' 
                : noteType === 'code'
                ? '// Paste your code here'
                : 'Start writing...'
            }
            rows={12}
            className="w-full px-4 py-3 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono text-sm"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 p-4 border-t border-border bg-bg-subtle">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg hover:bg-bg-elevated transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            note ? 'Update Note' : 'Create Note'
          )}
        </button>
      </div>
    </div>
  );
}

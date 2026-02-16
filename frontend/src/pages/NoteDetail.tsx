import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notesApi } from '../api';
import { NoteEditor } from '../components/notes/NoteEditor';
import { BacklinksPanel } from '../components/notes/BacklinksPanel';
import { NoteAnalytics } from '../components/notes/NoteAnalytics';
import { MarkdownEditor } from '../components/notes/MarkdownEditor';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, Pin, Star, Archive, Trash2, Edit2, 
  FileText, CheckSquare, Code, Mic, Globe, Markdown,
  Link2, Hash, Calendar
} from 'lucide-react';
import type { Note, NoteFolder, NoteTag } from '../types/notes';

const noteTypeIcons: Record<string, typeof FileText> = {
  text: FileText,
  checklist: CheckSquare,
  code: Code,
  voice: Mic,
  web_clip: Globe,
  markdown: Markdown,
};

const noteTypeLabels: Record<string, string> = {
  text: 'Text Note',
  checklist: 'Checklist',
  code: 'Code Snippet',
  voice: 'Voice Note',
  web_clip: 'Web Clip',
  markdown: 'Markdown',
};

export function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [allNotes, setAllNotes] = useState<{ id: string; title: string }[]>([]);
  const [showBacklinks, setShowBacklinks] = useState(false);

  useEffect(() => {
    if (id) {
      loadNote();
      loadSupportingData();
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

  const loadSupportingData = async () => {
    try {
      const [foldersRes, tagsRes, notesRes] = await Promise.all([
        notesApi.getFolders(),
        notesApi.getTags(),
        notesApi.getNotes(),
      ]);
      setFolders(foldersRes.data.results || foldersRes.data);
      setTags(tagsRes.data.results || tagsRes.data);
      setAllNotes((notesRes.data.results || notesRes.data).map((n: any) => ({ id: n.id, title: n.title })));
    } catch (error) {
      console.error('Failed to load supporting data', error);
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

  const handleAddLink = async (targetNoteId: string) => {
    if (!id) return;
    try {
      await notesApi.addLink(id, targetNoteId);
      loadNote();
    } catch (error) {
      console.error('Failed to add link', error);
    }
  };

  const handleRemoveLink = async (targetNoteId: string) => {
    if (!id) return;
    try {
      await notesApi.removeLink(id, targetNoteId);
      loadNote();
    } catch (error) {
      console.error('Failed to remove link', error);
    }
  };

  const renderContent = (content: string, noteType: string) => {
    if (!content) return null;

    if (noteType === 'markdown') {
      // Simple markdown rendering
      let html = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-bg-subtle p-3 rounded-lg my-3 overflow-x-auto"><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-bg-subtle px-1.5 py-0.5 rounded text-sm">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>')
        .replace(/\[\[([^\]]+)\]\]/g, '<span class="text-primary bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer">📎 $1</span>')
        .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded border-border" /><span>$1</span></div>')
        .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded border-border" /><span class="line-through text-fg-subtle">$1</span></div>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 my-1">$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1 list-decimal">$1</li>')
        .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 my-3 italic text-fg-subtle">$1</blockquote>')
        .replace(/\n/g, '<br />');
      
      return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    }

    if (noteType === 'code') {
      return (
        <pre className="bg-bg-subtle p-4 rounded-lg overflow-x-auto font-mono text-sm">
          <code>{content}</code>
        </pre>
      );
    }

    if (noteType === 'checklist') {
      const lines = content.split('\n');
      return (
        <div className="space-y-1">
          {lines.map((line, i) => {
            const checked = line.match(/^- \[x\] /i);
            const unchecked = line.match(/^- \[ \] /);
            const text = line.replace(/^- \[[x ]\] /i, '').replace(/^- /, '');
            
            if (checked || unchecked) {
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    disabled
                    className="rounded border-border"
                  />
                  <span className={checked ? 'line-through text-fg-subtle' : ''}>{text}</span>
                </div>
              );
            }
            return <div key={i}>{line}</div>;
          })}
        </div>
      );
    }

    // Default text rendering with wiki link support
    const parts = content.split(/(\[\[[^\]]+\]\])/g);
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const match = part.match(/^\[\[([^\]]+)\]\]$/);
          if (match) {
            return (
              <span
                key={i}
                className="text-primary bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors"
              >
                📎 {match[1]}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex items-center gap-3 text-fg-subtle">
          <div className="size-5 border-2 border-fg-subtle/30 border-t-fg-subtle rounded-full animate-spin" />
          Loading note...
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-fg-subtle">Note not found</div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-4">
          <button
            onClick={() => navigate('/notes')}
            className="flex items-center gap-2 text-fg-subtle hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Back to Notes
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

  const TypeIcon = noteTypeIcons[note.note_type] || FileText;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-2 text-fg-subtle hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Back to Notes
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBacklinks(!showBacklinks)}
            className={showBacklinks ? 'bg-primary/10 text-primary' : ''}
          >
            <Link2 className="size-4 mr-1.5" strokeWidth={1.5} />
            Links
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePin}
            className={note.is_pinned ? 'text-yellow-500' : ''}
          >
            <Pin className={`size-4 mr-1.5 ${note.is_pinned ? 'fill-current' : ''}`} strokeWidth={1.5} />
            {note.is_pinned ? 'Pinned' : 'Pin'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFavorite}
            className={note.is_favorite ? 'text-yellow-500' : ''}
          >
            <Star className={`size-4 mr-1.5 ${note.is_favorite ? 'fill-current' : ''}`} strokeWidth={1.5} />
            {note.is_favorite ? 'Favorited' : 'Favorite'}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="size-4 mr-1.5" strokeWidth={1.5} />
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={handleArchive}>
            <Archive className="size-4 mr-1.5" strokeWidth={1.5} />
            Archive
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="size-4 mr-1.5" strokeWidth={1.5} />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-elevated rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <TypeIcon className="size-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm text-fg-subtle">{noteTypeLabels[note.note_type]}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-4">{note.title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-fg-subtle">
                {note.folder_info && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-subtle rounded-full">
                    📁 {note.folder_info.name}
                  </span>
                )}

                {note.tags_info?.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                  >
                    <Hash className="size-3" strokeWidth={1.5} />
                    {tag.name}
                  </span>
                ))}

                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" strokeWidth={1.5} />
                  Updated {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {renderContent(note.content, note.note_type)}
            </div>

            {/* Attachments */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="p-6 border-t border-border bg-bg-subtle">
                <h3 className="font-medium mb-3">Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {note.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url || attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg hover:bg-bg-elevated/80 transition-colors text-sm"
                    >
                      {attachment.attachment_type === 'image' && '🖼️'}
                      {attachment.attachment_type === 'audio' && '🎵'}
                      {attachment.attachment_type === 'video' && '🎬'}
                      {attachment.attachment_type === 'file' && '📎'}
                      {attachment.attachment_type === 'link' && '🔗'}
                      <span className="truncate max-w-[200px]">{attachment.title || 'Attachment'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Analytics */}
          <NoteAnalytics noteId={note.id} />

          {/* Backlinks Panel */}
          {(showBacklinks || (note.outgoing_links && note.outgoing_links.length > 0) || (note.backlinks && note.backlinks.length > 0)) && (
            <BacklinksPanel
              outgoingLinks={note.outgoing_links || []}
              backlinks={note.backlinks || []}
              allNotes={allNotes}
              currentNoteId={note.id}
              onAddLink={handleAddLink}
              onRemoveLink={handleRemoveLink}
              onNavigate={(noteId) => navigate(`/notes/${noteId}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

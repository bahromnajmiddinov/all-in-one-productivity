import { Link } from 'react-router-dom';
import { Pin, Star, Archive, RotateCcw, FileText, CheckSquare, Code, Mic, Globe } from 'lucide-react';
import type { NoteListItem, NoteType } from '../../types/notes';

interface Props {
  note: NoteListItem;
  onPin: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onRestore?: () => void;
}

const noteTypeIcons: Record<NoteType, typeof FileText> = {
  text: FileText,
  checklist: CheckSquare,
  code: Code,
  voice: Mic,
  web_clip: Globe,
  markdown: FileText,
};

const noteTypeColors: Record<NoteType, string> = {
  text: 'text-blue-500',
  checklist: 'text-green-500',
  code: 'text-amber-500',
  voice: 'text-red-500',
  web_clip: 'text-cyan-500',
  markdown: 'text-purple-500',
};

export function NoteCard({ note, onPin, onFavorite, onArchive, onRestore }: Props) {
  const TypeIcon = noteTypeIcons[note.note_type];

  return (
    <Link
      to={`/notes/${note.id}`}
      className={`block bg-bg-elevated rounded-xl border p-4 hover:shadow-md transition-all group ${
        note.is_pinned ? 'border-yellow-400/50 bg-yellow-50/30' : 'border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeIcon className={`size-4 ${noteTypeColors[note.note_type]}`} strokeWidth={1.5} />
            {note.is_pinned && (
              <Pin className="size-3.5 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
            )}
            {note.is_favorite && (
              <Star className="size-3.5 text-yellow-500 fill-yellow-500" strokeWidth={1.5} />
            )}
            <h4 className="font-medium text-foreground truncate">{note.title}</h4>
          </div>
          
          <p className="text-sm text-fg-subtle line-clamp-2 mb-2">{note.preview}</p>
          
          <div className="flex items-center gap-3 text-xs text-fg-muted flex-wrap">
            {note.folder_name && (
              <span className="bg-bg-subtle px-2 py-0.5 rounded-full">
                {note.folder_name}
              </span>
            )}
            
            {note.tag_list && note.tag_list.length > 0 && (
              <div className="flex items-center gap-1">
                {note.tag_list.slice(0, 3).map(tag => (
                  <span
                    key={tag.id}
                    className="px-1.5 py-0.5 rounded-full text-[10px]"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
                {note.tag_list.length > 3 && (
                  <span className="text-fg-subtle">+{note.tag_list.length - 3}</span>
                )}
              </div>
            )}
            
            {note.word_count > 0 && (
              <span>{note.word_count} words</span>
            )}
            
            {note.link_count > 0 && (
              <span className="flex items-center gap-0.5">
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {note.link_count}
              </span>
            )}
            
            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div 
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.preventDefault()}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              onPin();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              note.is_pinned 
                ? 'text-yellow-500 bg-yellow-100' 
                : 'hover:bg-bg-subtle text-fg-subtle'
            }`}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={`size-4 ${note.is_pinned ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              note.is_favorite 
                ? 'text-yellow-500 bg-yellow-100' 
                : 'hover:bg-bg-subtle text-fg-subtle'
            }`}
            title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`size-4 ${note.is_favorite ? 'fill-current' : ''}`} strokeWidth={1.5} />
          </button>
          
          {onRestore ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onRestore();
              }}
              className="p-1.5 hover:bg-bg-subtle text-fg-subtle rounded-lg transition-colors"
              title="Restore from archive"
            >
              <RotateCcw className="size-4" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onArchive();
              }}
              className="p-1.5 hover:bg-bg-subtle text-fg-subtle rounded-lg transition-colors"
              title="Archive"
            >
              <Archive className="size-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

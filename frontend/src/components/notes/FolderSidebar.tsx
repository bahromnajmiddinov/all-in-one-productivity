import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { Folder, ChevronRight, ChevronDown, FileText, Star, Clock, Archive } from 'lucide-react';
import type { NoteFolder } from '../../types/notes';

interface Props {
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  filterType?: string;
  onFilterTypeChange?: (type: string) => void;
}

interface FolderNodeProps {
  folder: NoteFolder;
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  level: number;
}

function FolderNode({ folder, selectedFolder, onSelectFolder, level }: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onSelectFolder(folder.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          selectedFolder === folder.id
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-bg-subtle text-fg-subtle hover:text-foreground'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-bg-elevated rounded"
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" strokeWidth={1.5} />
            ) : (
              <ChevronRight className="size-3.5" strokeWidth={1.5} />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-4" />}
        <Folder className="size-4" style={{ color: folder.color }} strokeWidth={1.5} />
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className="text-xs text-fg-muted">{folder.note_count}</span>
      </button>

      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar({ 
  selectedFolder, 
  onSelectFolder, 
  filterType = 'all',
  onFilterTypeChange 
}: Props) {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await notesApi.getFolderTree();
      setFolders(response.data || []);
    } catch (error) {
      console.error('Failed to load folders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-bg-subtle border-r border-border p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Notes</h3>
        <div className="text-sm text-fg-subtle">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-bg-subtle border-r border-border flex flex-col h-full">
      {/* Quick Filters */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold mb-3">Notes</h3>
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectFolder(null);
              onFilterTypeChange?.('all');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedFolder === null && filterType === 'all'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-bg-elevated text-fg-subtle hover:text-foreground'
            }`}
          >
            <FileText className="size-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">All Notes</span>
          </button>
          
          <button
            onClick={() => {
              onSelectFolder(null);
              onFilterTypeChange?.('favorites');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              filterType === 'favorites'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-bg-elevated text-fg-subtle hover:text-foreground'
            }`}
          >
            <Star className="size-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">Favorites</span>
          </button>
          
          <button
            onClick={() => {
              onSelectFolder(null);
              onFilterTypeChange?.('recent');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              filterType === 'recent'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-bg-elevated text-fg-subtle hover:text-foreground'
            }`}
          >
            <Clock className="size-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">Recent</span>
          </button>
          
          <button
            onClick={() => {
              onSelectFolder(null);
              onFilterTypeChange?.('archived');
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              filterType === 'archived'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-bg-elevated text-fg-subtle hover:text-foreground'
            }`}
          >
            <Archive className="size-4" strokeWidth={1.5} />
            <span className="flex-1 text-left">Archive</span>
          </button>
        </div>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-xs font-medium text-fg-subtle uppercase tracking-wider mb-2">Folders</h4>
        <div className="space-y-0.5">
          {folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              level={0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

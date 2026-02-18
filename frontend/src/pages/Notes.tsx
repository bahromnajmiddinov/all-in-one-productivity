import { useState, useEffect } from 'react';
import { FolderSidebar } from '../components/notes/FolderSidebar';
import { NoteList } from '../components/notes/NoteList';
import { NoteEditor } from '../components/notes/NoteEditor';
import { KnowledgeGraph } from '../components/notes/KnowledgeGraph';
import { QuickCapture } from '../components/notes/QuickCapture';
import { TemplateSelector } from '../components/notes/TemplateSelector';
import { NoteAnalytics } from '../components/notes/NoteAnalytics';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Plus, Search, LayoutGrid, Network, BarChart3, Filter, X, FileText } from 'lucide-react';
import { notesApi } from '../api';
import { cn } from '../lib/utils';
import type { NoteFolder, NoteTag, NoteGraphData } from '../types/notes';

type ViewMode = 'list' | 'graph' | 'analytics';
type FilterType = 'all' | 'favorites' | 'recent' | 'archived';

export function Notes() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [graphData, setGraphData] = useState<NoteGraphData>({ nodes: [], edges: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadFoldersAndTags();
    if (viewMode === 'graph') {
      loadGraphData();
    }
  }, [viewMode]);

  const loadFoldersAndTags = async () => {
    try {
      const [foldersRes, tagsRes] = await Promise.all([
        notesApi.getFolderTree(),
        notesApi.getTags(),
      ]);
      setFolders(foldersRes.data || foldersRes.data.results || []);
      setTags(tagsRes.data.results || tagsRes.data);
    } catch (error) {
      console.error('Failed to load folders/tags', error);
    }
  };

  const loadGraphData = async () => {
    try {
      const response = await notesApi.getGraphData();
      setGraphData(response.data);
    } catch (error) {
      console.error('Failed to load graph data', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    if (viewMode === 'graph') {
      loadGraphData();
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    setShowTemplateSelector(false);
    if (templateId) {
      try {
        const response = await notesApi.useTemplate(templateId);
        if (response.data.note_id) {
          window.location.href = `/notes/${response.data.note_id}`;
        }
      } catch (error) {
        console.error('Failed to use template', error);
      }
    } else {
      setShowEditor(true);
    }
  };

  const getFilterParams = () => {
    const params: any = {};
    if (filterType === 'favorites') params.favorites = true;
    if (filterType === 'archived') params.archived = 'true';
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (selectedTag) params.tag = selectedTag;
    return params;
  };

  const hasActiveFilters = filterType !== 'all' || selectedTag || dateFrom || dateTo;

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <FolderSidebar
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg-elevated">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-[var(--radius)] bg-warning-subtle text-warning">
                  <FileText className="w-5 h-5" />
                </div>
                <h1 className="text-h1">Notes</h1>
              </div>
              <p className="text-body-sm text-fg-subtle">
                Organize your thoughts with bidirectional linking and knowledge graphs.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex bg-bg-subtle rounded-[var(--radius-sm)] p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-fast',
                    viewMode === 'list' 
                      ? 'bg-bg-elevated shadow-sm text-foreground' 
                      : 'text-fg-muted hover:text-foreground'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-fast',
                    viewMode === 'graph' 
                      ? 'bg-bg-elevated shadow-sm text-foreground' 
                      : 'text-fg-muted hover:text-foreground'
                  )}
                >
                  <Network className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Graph</span>
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-fast',
                    viewMode === 'analytics' 
                      ? 'bg-bg-elevated shadow-sm text-foreground' 
                      : 'text-fg-muted hover:text-foreground'
                  )}
                >
                  <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Analytics</span>
                </button>
              </div>

              <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

              {viewMode === 'list' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" strokeWidth={1.5} />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notes..."
                      className="pl-9 w-48"
                    />
                  </div>

                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant={showFilters ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    <Filter className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </>
              )}

              <Button onClick={() => setShowTemplateSelector(true)} size="sm">
                <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
                New Note
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && viewMode === 'list' && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-3">
              <span className="text-body-sm text-fg-subtle">Filters:</span>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="px-3 py-1.5 bg-bg-subtle border border-border rounded-[var(--radius-sm)] text-sm text-foreground"
              >
                <option value="all">All Notes</option>
                <option value="favorites">⭐ Favorites</option>
                <option value="recent">🕐 Recent</option>
                <option value="archived">🗑️ Archived</option>
              </select>

              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-1.5 bg-bg-subtle border border-border rounded-[var(--radius-sm)] text-sm text-foreground"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 bg-bg-subtle border border-border rounded-[var(--radius-sm)] text-sm text-foreground"
                placeholder="From"
              />
              <span className="text-fg-subtle text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 bg-bg-subtle border border-border rounded-[var(--radius-sm)] text-sm text-foreground"
                placeholder="To"
              />

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterType('all');
                    setSelectedTag('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="flex items-center gap-1 text-sm text-fg-muted hover:text-foreground transition-fast"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {viewMode === 'list' && (
            <>
              {showEditor && (
                <div className="mb-6 animate-slide-in-bottom">
                  <NoteEditor
                    folderId={selectedFolder || undefined}
                    onSave={() => {
                      setShowEditor(false);
                      handleRefresh();
                    }}
                    onCancel={() => setShowEditor(false)}
                  />
                </div>
              )}

              <NoteList
                key={refreshKey}
                folderId={selectedFolder || undefined}
                searchQuery={searchQuery || undefined}
                filterType={filterType}
                filters={getFilterParams()}
                onRefresh={handleRefresh}
              />
            </>
          )}

          {viewMode === 'graph' && (
            <div className="h-[calc(100vh-180px)] min-h-[400px]">
              <KnowledgeGraph
                data={graphData}
                onNodeClick={(noteId) => {
                  window.location.href = `/notes/${noteId}`;
                }}
              />
            </div>
          )}

          {viewMode === 'analytics' && (
            <div className="max-w-4xl">
              <NoteAnalytics />
            </div>
          )}
        </div>
      </div>

      {/* Quick Capture FAB */}
      <QuickCapture
        folders={folders}
        tags={tags}
        onCapture={handleRefresh}
      />

      {/* Template Selector Modal */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
          </DialogHeader>
          <TemplateSelector
            onSelect={handleSelectTemplate}
            onClose={() => setShowTemplateSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

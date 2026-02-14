import { useState } from 'react';
import { FolderSidebar } from '../components/notes/FolderSidebar';
import { NoteList } from '../components/notes/NoteList';
import { NoteEditor } from '../components/notes/NoteEditor';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

export function Notes() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <FolderSidebar
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
      />

      <div className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h1">Notes</h1>
            <p className="text-body mt-1">Clean writing with folders and tags.</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-48"
            />
            <Button onClick={() => setShowEditor(!showEditor)} size="md">
              <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
              {showEditor ? 'Cancel' : 'New Note'}
            </Button>
          </div>
        </div>

        {showEditor && (
          <div className="mb-6">
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
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}

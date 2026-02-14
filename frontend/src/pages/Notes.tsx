import { useState } from 'react';
import { FolderSidebar } from '../components/notes/FolderSidebar';
import { NoteList } from '../components/notes/NoteList';
import { NoteEditor } from '../components/notes/NoteEditor';

export function Notes() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex h-[calc(100vh-60px)]">
      <FolderSidebar
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Notes</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {showEditor ? 'Cancel' : '+ New Note'}
            </button>
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

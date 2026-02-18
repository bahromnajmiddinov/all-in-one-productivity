import { ProjectList } from '../components/ProjectList';
import { FolderKanban } from 'lucide-react';

export function Projects() {
  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-[var(--radius)] bg-accent-subtle text-accent">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h1 className="text-h1">Projects</h1>
        </div>
        <p className="text-body max-w-2xl">
          Organize tasks by project and track progress. Create projects to group related tasks 
          and monitor completion rates.
        </p>
      </div>

      {/* Project List */}
      <ProjectList />
    </div>
  );
}

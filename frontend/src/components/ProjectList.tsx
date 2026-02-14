import { useEffect, useState, type FormEvent } from 'react';
import { projectApi } from '../api';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { FolderKanban, Plus } from 'lucide-react';
import type { Project } from '../types';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectApi.getProjects();
      setProjects(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load projects');
    }
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProject.trim()) return;
    try {
      await projectApi.createProject({
        name: newProject,
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      });
      setNewProject('');
      loadProjects();
    } catch (error) {
      console.error('Failed to load projects');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="New project..."
          className="flex-1"
        />
        <Button type="submit">
          <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
          Add
        </Button>
      </form>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-10" strokeWidth={1} />}
          title="No projects yet"
          description="Create a project to group and track related tasks."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-[var(--radius)] border border-border bg-bg-elevated p-5 shadow-soft transition-smooth hover:shadow-soft-md"
              style={{ borderLeftWidth: '4px', borderLeftColor: project.color }}
            >
              <p className="text-sm font-medium text-foreground">{project.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

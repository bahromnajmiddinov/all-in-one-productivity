import { useEffect, useState, type FormEvent } from 'react';
import { projectApi } from '../api';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Card, CardContent } from './ui/Card';
import { FolderKanban, Plus, ArrowRight } from 'lucide-react';
import type { Project } from '../types';

const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await projectApi.getProjects();
      setProjects(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProject.trim()) return;
    
    try {
      setIsSubmitting(true);
      const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
      await projectApi.createProject({
        name: newProject,
        color: randomColor,
      });
      setNewProject('');
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-bg-subtle rounded-[var(--radius-sm)] animate-pulse" />
          <div className="w-24 h-10 bg-bg-subtle rounded-[var(--radius-sm)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-bg-subtle rounded-[var(--radius)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Project Form */}
      <form onSubmit={handleAdd} className="flex gap-3">
        <Input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="New project name..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={!newProject.trim() || isSubmitting}
          isLoading={isSubmitting}
        >
          <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
          Add
        </Button>
      </form>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-10 h-10" strokeWidth={1} />}
          title="No projects yet"
          description="Create a project to group and track related tasks. Projects help you organize your work and monitor progress."
          action={
            <Button onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()}>
              <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
              Create First Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id}
              isInteractive
              className="overflow-hidden group"
            >
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Color Bar */}
                  <div 
                    className="w-1.5 flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  
                  {/* Content */}
                  <div className="flex-1 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {project.name}
                      </p>
                      <p className="text-caption text-fg-subtle mt-0.5">
                        Created {new Date(project.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-fg-subtle opacity-0 group-hover:opacity-100 transition-fast flex-shrink-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { projectApi } from '../api';
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
    if (!newProject.trim()) {
      return;
    }
    try {
      await projectApi.createProject({
        name: newProject,
        color: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`,
      });
      setNewProject('');
      loadProjects();
    } catch (error) {
      console.error('Failed to create project');
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newProject}
          onChange={(event) => setNewProject(event.target.value)}
          placeholder="New project..."
          className="flex-1 p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Add
        </button>
      </form>
      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 border rounded"
            style={{ borderLeft: `4px solid ${project.color}` }}
          >
            {project.name}
          </div>
        ))}
      </div>
    </div>
  );
}

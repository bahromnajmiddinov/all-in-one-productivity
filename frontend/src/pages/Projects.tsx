import { ProjectList } from '../components/ProjectList';

export function Projects() {
  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="mb-8">
        <h1 className="text-h1">Projects</h1>
        <p className="text-body mt-1">Organize tasks by project and track progress.</p>
      </div>
      <ProjectList />
    </div>
  );
}

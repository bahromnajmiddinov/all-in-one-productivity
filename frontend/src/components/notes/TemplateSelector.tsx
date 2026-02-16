import { useState, useEffect } from 'react';
import { notesApi } from '../../api';
import { FileText, Calendar, Code, BookOpen, ListTodo, FlaskConical, Newspaper, PenLine, X, Plus } from 'lucide-react';
import type { NoteTemplate } from '../../types/notes';

interface Props {
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

const iconMap: Record<string, typeof FileText> = {
  blank: FileText,
  meeting: Calendar,
  daily: Calendar,
  project: FlaskConical,
  research: BookOpen,
  code: Code,
  journal: PenLine,
  todo: ListTodo,
  custom: FileText,
};

const colorMap: Record<string, string> = {
  blank: '#6B7280',
  meeting: '#3B82F6',
  daily: '#10B981',
  project: '#F59E0B',
  research: '#8B5CF6',
  code: '#EF4444',
  journal: '#EC4899',
  todo: '#06B6D4',
  custom: '#6B7280',
};

export function TemplateSelector({ onSelect, onClose }: Props) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    template_type: 'custom',
    title_template: '',
    content_template: '',
    description: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await notesApi.getTemplates();
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load templates', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notesApi.createTemplate(newTemplate);
      setShowCreateForm(false);
      setNewTemplate({
        name: '',
        template_type: 'custom',
        title_template: '',
        content_template: '',
        description: '',
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template', error);
      alert('Failed to create template');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-bg-elevated rounded-xl p-8">
          <div className="text-fg-subtle">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-bg-elevated rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {showCreateForm ? 'Create Template' : 'Choose a Template'}
          </h2>
          <div className="flex items-center gap-2">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="size-4" strokeWidth={1.5} />
                New Template
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-subtle rounded-lg transition-colors"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {showCreateForm ? (
          <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Template Name</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., Meeting Notes"
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Template Type</label>
              <select
                value={newTemplate.template_type}
                onChange={(e) => setNewTemplate({ ...newTemplate, template_type: e.target.value })}
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="blank">Blank Note</option>
                <option value="meeting">Meeting Notes</option>
                <option value="daily">Daily Log</option>
                <option value="project">Project Plan</option>
                <option value="research">Research Notes</option>
                <option value="code">Code Snippet</option>
                <option value="journal">Journal Entry</option>
                <option value="todo">To-Do List</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Default Title</label>
              <input
                type="text"
                value={newTemplate.title_template}
                onChange={(e) => setNewTemplate({ ...newTemplate, title_template: e.target.value })}
                placeholder="e.g., Meeting - {{date}}"
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-fg-muted mt-1">Use {'{{date}}'} for current date</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Content Template</label>
              <textarea
                value={newTemplate.content_template}
                onChange={(e) => setNewTemplate({ ...newTemplate, content_template: e.target.value })}
                placeholder="# Meeting Notes

## Attendees
- 

## Agenda
1. 

## Notes

## Action Items
- [ ] "
                rows={10}
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <input
                type="text"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Brief description of this template..."
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-fg-subtle hover:bg-bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Template
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-fg-subtle">
                No templates yet. Create your first template!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Blank option */}
                <button
                  onClick={() => onSelect('')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="size-6 text-gray-500" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">Blank Note</div>
                    <div className="text-xs text-fg-subtle">Start from scratch</div>
                  </div>
                </button>

                {templates.map((template) => {
                  const Icon = iconMap[template.template_type] || FileText;
                  const color = template.color || colorMap[template.template_type] || '#6B7280';
                  
                  return (
                    <button
                      key={template.id}
                      onClick={() => onSelect(template.id)}
                      className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="size-6" style={{ color }} strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-fg-subtle line-clamp-1">{template.description}</div>
                        )}
                        <div className="text-xs text-fg-muted mt-1">
                          Used {template.usage_count} times
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

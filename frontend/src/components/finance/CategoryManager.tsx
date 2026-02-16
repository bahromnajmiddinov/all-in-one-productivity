import { useEffect, useState } from 'react';
import { FolderTree, Plus, Trash2, ChevronRight } from 'lucide-react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Card, CardContent } from '../ui/Card';

interface Category {
  id: string;
  name: string;
  parent?: string | null;
}

interface CategoryManagerProps {
  onUpdate?: () => void;
}

export function CategoryManager({ onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getCategories();
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await financeApi.createCategory({ name, parent: parent || null });
      setName('');
      setParent('');
      setShowForm(false);
      load();
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await financeApi.deleteCategory(id);
      load();
      onUpdate?.();
    } catch (err) {
      console.error(err);
    }
  };

  const parentCategories = categories.filter(c => !c.parent);
  const childCategories = categories.filter(c => c.parent);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-bg-subtle rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-3 rounded-lg bg-bg-subtle space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="bg-bg-elevated"
          />
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <option value="">No parent (top-level)</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-6 h-6" />}
          title="No categories"
          description="Create categories to organize your transactions."
        />
      ) : (
        <div className="space-y-1">
          {parentCategories.map((cat) => {
            const children = childCategories.filter(c => c.parent === cat.id);
            return (
              <div key={cat.id}>
                <Card className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-fg-muted" />
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-fg-muted hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Child Categories */}
                {children.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {children.map((child) => (
                      <Card key={child.id} className="overflow-hidden bg-bg-subtle/50">
                        <CardContent className="p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-fg-muted" />
                              <span className="text-sm">{child.name}</span>
                            </div>
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="p-1 rounded-md hover:bg-red-500/10 text-fg-muted hover:text-red-600 transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Category
        </Button>
      )}
    </div>
  );
}

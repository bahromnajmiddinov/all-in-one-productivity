import { useEffect, useState } from 'react';
import { financeApi } from '../../api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Category {
  id: string;
  name: string;
  parent?: string | null;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');

  const load = async () => {
    try {
      const res = await financeApi.getCategories();
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
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
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
        >
          <option value="">No parent</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <div className="flex justify-end">
          <Button type="submit">Add</Button>
        </div>
      </form>
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-sm text-muted-foreground">No categories created yet.</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="p-3 rounded border bg-bg-elevated">
              <div className="text-sm font-medium">{cat.name}</div>
              <div className="text-xs text-muted-foreground">{cat.parent ? 'Subcategory' : 'Top-level'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

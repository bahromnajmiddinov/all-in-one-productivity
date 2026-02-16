import { useState } from 'react';
import { Tag } from 'lucide-react';
import type { HabitCategory } from '../../types/habits';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

export function HabitCategoryManager({
  categories,
  onCreate,
  onDelete,
}: {
  categories: HabitCategory[];
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="size-4 text-fg-muted" />
          Habit categories
        </CardTitle>
        <CardDescription>Group habits by focus area for quick filtering.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a category"
          />
          <Button type="button" onClick={handleSubmit} className="md:w-auto">
            Add category
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className="text-caption text-fg-muted">No categories yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-bg-subtle/40 px-3 py-1 text-xs"
              >
                <span>{category.name}</span>
                <button
                  type="button"
                  onClick={() => onDelete(category.id)}
                  className="text-fg-muted hover:text-destructive"
                  aria-label={`Delete ${category.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

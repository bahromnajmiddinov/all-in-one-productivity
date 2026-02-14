import { useState } from 'react';
import { habitApi } from '../../api';

interface Props {
  onSuccess: () => void;
}

export function HabitForm({ onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10B981');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await habitApi.createHabit({
        name,
        description,
        color,
        frequency: 'daily',
      });
      setName('');
      setDescription('');
      onSuccess();
    } catch (error) {
      console.error('Failed to create habit');
    }
  };

  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h3 className="font-semibold mb-4">Create New Habit</h3>

      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name..."
          className="w-full p-2 border rounded"
          required
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)..."
          className="w-full p-2 border rounded"
          rows={2}
        />

        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Habit
        </button>
      </div>
    </form>
  );
}

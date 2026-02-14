import { useState } from 'react';
import { calendarApi } from '../../api';

export function EventForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await calendarApi.createEvent({
        title,
        description,
        start_date: startDate,
        start_time: isAllDay ? null : startTime,
        end_date: startDate,
        end_time: isAllDay ? null : endTime,
        is_all_day: isAllDay,
        color,
        event_type: 'event',
      });
      onSuccess();
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create event');
    }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

  return (
    <form onSubmit={handleSubmit} className="bg-bg-elevated rounded-[var(--radius)] shadow-soft border border-border p-5 mb-6">
      <h3 className="font-semibold mb-4">Add Event</h3>
      
      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title..."
          className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          required
        />
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)..."
          className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          rows={2}
        />
        
        <div className="flex gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-border rounded-md bg-background"
            required
          />
          
          {!isAllDay && (
            <>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="p-2 border border-border rounded-md bg-background"
              />
              <span className="self-center">to</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="p-2 border border-border rounded-md bg-background"
              />
            </>
          )}
        </div>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
          />
          <span className="text-sm">All day event</span>
        </label>
        
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ring' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        
        <button
          type="submit"
          className="w-full py-2.5 bg-foreground text-background rounded-md font-medium hover:opacity-90 transition-smooth"
        >
          Add Event
        </button>
      </div>
    </form>
  );
}
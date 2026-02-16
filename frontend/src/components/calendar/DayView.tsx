import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { CalendarEvent } from '../../types/calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    try {
      const response = await calendarApi.getDayEvents(dateStr);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const getEventsForHour = (hour: number) => {
    return events.filter(event => {
      if (!event.start_time) return false;
      const eventHour = parseInt(event.start_time.split(':')[0]);
      return eventHour === hour;
    });
  };

  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isToday = new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="bg-bg-elevated rounded-[var(--radius)] shadow-soft border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          ← Prev
        </button>
        <h3 className={`text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>
          {dateStr}
        </h3>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          Next →
        </button>
      </div>

      {/* Day grid */}
      <div className="max-h-96 overflow-y-auto">
        {HOURS.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className="flex border-b min-h-16">
              <div className="w-16 p-2 text-xs text-fg-muted border-r flex-shrink-0">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-1 relative">
                {hourEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-xs px-2 py-1 rounded text-white mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: event.color }}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-white/80 text-[10px] mt-0.5 truncate">{event.description}</div>
                    )}
                    {event.location && (
                      <div className="text-white/80 text-[10px] mt-0.5">📍 {event.location}</div>
                    )}
                    {event.event_type === 'meeting' && event.meeting_link && (
                      <a
                        href={event.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 text-[10px] mt-0.5 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join Meeting →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

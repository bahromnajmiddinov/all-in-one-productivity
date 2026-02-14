import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { CalendarEvent } from '../../types/calendar';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    const start = getWeekStart(currentDate).toISOString().split('T')[0];
    const end = getWeekEnd(currentDate).toISOString().split('T')[0];
    
    try {
      const response = await calendarApi.getEvents({ start, end });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    return new Date(start.setDate(start.getDate() + 6));
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    const dateStr = day.toISOString().split('T')[0];
    return events.filter(event => {
      if (event.start_date !== dateStr) return false;
      if (!event.start_time) return false;
      const eventHour = parseInt(event.start_time.split(':')[0]);
      return eventHour === hour;
    });
  };

  const weekDays = getWeekDays();
  const weekRange = `${weekDays[0].toLocaleDateString()} - ${weekDays[6].toLocaleDateString()}`;

  return (
    <div className="bg-bg-elevated rounded-[var(--radius)] shadow-soft border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          ← Prev
        </button>
        <h3 className="text-lg font-semibold">{weekRange}</h3>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          Next →
        </button>
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="min-w-800">
          {/* Days header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-center text-sm text-fg-muted">Time</div>
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className={`p-2 text-center text-sm font-medium ${
                  day.toDateString() === new Date().toDateString() ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="max-h-96 overflow-y-auto">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b min-h-16">
                <div className="p-2 text-xs text-fg-muted border-r">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  return (
                    <div key={dayIndex} className="border-r p-1 relative">
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="text-xs px-2 py-1 rounded text-white mb-1"
                          style={{ backgroundColor: event.color }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { CalendarEvent } from '../../types/calendar';

export function MonthView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    try {
      const response = await calendarApi.getEvents({ start, end });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];
    
    return events.filter(event => 
      event.start_date <= dateStr && 
      (event.end_date >= dateStr || !event.end_date)
    );
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
          className="px-3 py-1 border rounded hover:bg-gray-50"
        >
          ← Prev
        </button>
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
          className="px-3 py-1 border rounded hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-24 border-r border-b p-1" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = new Date().toDateString() === 
            new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
          
          return (
            <div 
              key={day} 
              className={`min-h-24 border-r border-b p-1 ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="text-xs px-1 py-0.5 rounded text-white truncate"
                    style={{ backgroundColor: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
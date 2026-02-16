import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { CalendarEvent } from '../../types/calendar';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function YearView() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentYear]);

  const loadEvents = async () => {
    setLoading(true);
    const start = `${currentYear}-01-01`;
    const end = `${currentYear}-12-31`;
    
    try {
      const response = await calendarApi.getEventsRange(start, end);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDay = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => 
      event.start_date <= dateStr && 
      (event.end_date == null || event.end_date >= dateStr)
    );
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthlyEventCount = (month: number) => {
    const start = `${currentYear}-${String(month + 1).padStart(2, '0')}-01`;
    const end = `${currentYear}-${String(month + 1).padStart(2, '0')}-${getDaysInMonth(currentYear, month)}`;
    
    return events.filter(event => 
      event.start_date <= end && 
      (event.end_date == null || event.end_date >= start)
    ).length;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <div className="bg-bg-elevated rounded-[var(--radius)] shadow-soft border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setCurrentYear(currentYear - 1)}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          ← {currentYear - 1}
        </button>
        <h3 className="text-lg font-semibold">{currentYear}</h3>
        <button
          onClick={() => setCurrentYear(currentYear + 1)}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          {currentYear + 1} →
        </button>
      </div>

      {/* Year grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MONTHS.map((month, monthIndex) => {
              const daysInMonth = getDaysInMonth(currentYear, monthIndex);
              const firstDay = getFirstDayOfMonth(currentYear, monthIndex);
              const eventCount = getMonthlyEventCount(monthIndex);
              
              return (
                <div
                  key={monthIndex}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Month header */}
                  <div className="p-2 bg-bg-subtle border-b border-border">
                    <div className="font-semibold text-sm">{month}</div>
                    <div className="text-xs text-fg-muted">{eventCount} event{eventCount !== 1 ? 's' : ''}</div>
                  </div>
                  
                  {/* Mini calendar */}
                  <div className="p-1">
                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div
                          key={i}
                          className="text-center text-[10px] text-fg-muted font-medium"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                      ))}
                      
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDay(currentYear, monthIndex, day);
                        const today = isToday(currentYear, monthIndex, day);
                        
                        return (
                          <div
                            key={day}
                            className={`
                              aspect-square rounded text-xs flex flex-col items-center justify-center cursor-pointer
                              ${today ? 'bg-blue-100 text-blue-600 font-bold' : 'hover:bg-bg-subtle'}
                              ${dayEvents.length > 0 ? 'font-medium' : ''}
                            `}
                          >
                            <div className="leading-none mb-0.5">{day}</div>
                            {dayEvents.length > 0 && (
                              <div className="flex gap-0.5 flex-wrap justify-center">
                                {dayEvents.slice(0, 3).map(event => (
                                  <div
                                    key={event.id}
                                    className="w-1 h-1 rounded-full"
                                    style={{ backgroundColor: event.color }}
                                  />
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-[8px] text-fg-muted leading-none">+</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { CalendarEvent } from '../../types/calendar';

export function AgendaView() {
  const [startDate, setStartDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadEvents();
  }, [startDate]);

  const loadEvents = async () => {
    const start = startDate.toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    const end = endDate.toISOString().split('T')[0];
    
    try {
      const response = await calendarApi.getEventsRange(start, end);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const groupEventsByDate = () => {
    const grouped: Record<string, CalendarEvent[]> = {};
    
    events.forEach(event => {
      const date = event.start_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    // Sort each group by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
    
    return grouped;
  };

  const groupedEvents = groupEventsByDate();
  const dates = Object.keys(groupedEvents).sort();

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return '👥';
      case 'appointment':
        return '📅';
      case 'deadline':
        return '⚠️';
      case 'time_block':
        return '🧱';
      case 'task':
        return '✅';
      case 'habit':
        return '🔄';
      case 'reminder':
        return '🔔';
      case 'pomodoro':
        return '🍅';
      default:
        return '📌';
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'All day';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-bg-elevated rounded-[var(--radius)] shadow-soft border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => {
            const newDate = new Date(startDate);
            newDate.setDate(newDate.getDate() - 7);
            setStartDate(newDate);
          }}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          ← Prev Week
        </button>
        <h3 className="text-lg font-semibold">
          Agenda
        </h3>
        <button
          onClick={() => {
            const newDate = new Date(startDate);
            newDate.setDate(newDate.getDate() + 7);
            setStartDate(newDate);
          }}
          className="px-3 py-1 border border-border rounded-md hover:bg-bg-subtle transition-smooth"
        >
          Next Week →
        </button>
      </div>

      {/* Agenda List */}
      <div className="max-h-[600px] overflow-y-auto p-4">
        {dates.length === 0 ? (
          <div className="text-center py-12 text-fg-muted">
            <p className="text-lg">No upcoming events</p>
            <p className="text-sm mt-2">Events for the next 30 days will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map(dateStr => {
              const dayEvents = groupedEvents[dateStr];
              const date = new Date(dateStr + 'T00:00:00');
              const isToday = new Date().toDateString() === date.toDateString();
              const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === date.toDateString();
              
              return (
                <div key={dateStr} className="space-y-3">
                  <div className={`flex items-center gap-2 ${isToday ? 'text-blue-600' : 'text-fg-muted'}`}>
                    {isToday && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">Today</span>}
                    {isTomorrow && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Tomorrow</span>}
                    <h4 className="font-semibold text-lg">
                      {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                  </div>
                  
                  <div className="space-y-2 ml-4">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className="flex gap-3 p-3 rounded-lg bg-bg-subtle hover:bg-bg-accent transition-smooth cursor-pointer"
                      >
                        {/* Time column */}
                        <div className="w-20 flex-shrink-0 text-sm text-fg-muted pt-0.5">
                          {formatTime(event.start_time)}
                          {event.end_time && event.start_time !== event.end_time && (
                            <>
                              <br />
                              {formatTime(event.end_time)}
                            </>
                          )}
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getEventTypeIcon(event.event_type)}</span>
                            <h5 className="font-medium text-foreground truncate">{event.title}</h5>
                            {event.status === 'tentative' && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Tentative</span>
                            )}
                            {event.has_conflict && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">⚠️ Conflict</span>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-fg-muted mt-1 line-clamp-2">{event.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-fg-muted">
                            {event.location && (
                              <span>📍 {event.location}</span>
                            )}
                            {event.duration_minutes && (
                              <span>⏱️ {Math.floor(event.duration_minutes / 60)}h {event.duration_minutes % 60}m</span>
                            )}
                            {event.calendar_name && (
                              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: event.color + '20', color: event.color }}>
                                {event.calendar_name}
                              </span>
                            )}
                          </div>
                          
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="mt-2 text-xs text-fg-muted">
                              👥 {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          
                          {event.meeting_link && (
                            <a
                              href={event.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Join Meeting →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
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

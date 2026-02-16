import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { Calendar } from '../../types/calendar';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';

export function CalendarLayers({ 
  onLayersChange, 
  onEventTypesChange 
}: { 
  onLayersChange?: (calendars: string[]) => void;
  onEventTypesChange?: (types: string[]) => void;
}) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  const EVENT_TYPES = [
    { id: 'event', label: 'Events', color: '#3B82F6' },
    { id: 'meeting', label: 'Meetings', color: '#8B5CF6' },
    { id: 'appointment', label: 'Appointments', color: '#EC4899' },
    { id: 'deadline', label: 'Deadlines', color: '#EF4444' },
    { id: 'time_block', label: 'Time Blocks', color: '#F59E0B' },
    { id: 'task', label: 'Tasks', color: '#10B981' },
    { id: 'habit', label: 'Habits', color: '#6366F1' },
    { id: 'reminder', label: 'Reminders', color: '#6B7280' },
    { id: 'pomodoro', label: 'Pomodoro', color: '#F97316' },
  ];

  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set(EVENT_TYPES.map(t => t.id)));

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    setLoading(true);
    try {
      const response = await calendarApi.getCalendars();
      setCalendars(response.data);
      // Select all visible calendars by default
      const defaultCalendars = response.data
        .filter((c: Calendar) => c.is_visible)
        .map((c: Calendar) => c.id);
      setSelectedCalendars(new Set(defaultCalendars));
    } catch (error) {
      console.error('Failed to load calendars');
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    const newSelected = new Set(selectedCalendars);
    if (newSelected.has(calendarId)) {
      newSelected.delete(calendarId);
    } else {
      newSelected.add(calendarId);
    }
    setSelectedCalendars(newSelected);
    onLayersChange?.(Array.from(newSelected));
  };

  const toggleEventType = (typeId: string) => {
    const newSelected = new Set(selectedEventTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
    } else {
      newSelected.add(typeId);
    }
    setSelectedEventTypes(newSelected);
    onEventTypesChange?.(Array.from(newSelected));
  };

  const toggleAllCalendars = () => {
    if (selectedCalendars.size === calendars.length) {
      setSelectedCalendars(new Set());
      onLayersChange?.([]);
    } else {
      const allIds = calendars.map(c => c.id);
      setSelectedCalendars(new Set(allIds));
      onLayersChange?.(allIds);
    }
  };

  const toggleAllEventTypes = () => {
    if (selectedEventTypes.size === EVENT_TYPES.length) {
      setSelectedEventTypes(new Set());
      onEventTypesChange?.([]);
    } else {
      const allIds = EVENT_TYPES.map(t => t.id);
      setSelectedEventTypes(new Set(allIds));
      onEventTypesChange?.(allIds);
    }
  };

  return (
    <div className="bg-bg-elevated rounded-[var(--radius)] border border-border p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left font-semibold hover:text-blue-600 transition-colors"
      >
        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        Calendar Layers
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Calendars section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-fg-muted">Calendars</h4>
              <button
                onClick={toggleAllCalendars}
                className="text-xs text-blue-600 hover:underline"
              >
                {selectedCalendars.size === calendars.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {loading ? (
              <div className="text-sm text-fg-muted">Loading calendars...</div>
            ) : (
              <div className="space-y-2">
                {calendars.map(calendar => (
                  <label
                    key={calendar.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-bg-subtle p-1.5 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCalendars.has(calendar.id)}
                      onChange={() => toggleCalendar(calendar.id)}
                      className="rounded border-border"
                    />
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: calendar.color }}
                    />
                    <span className="text-sm truncate flex-1">{calendar.name}</span>
                    {calendar.event_count > 0 && (
                      <span className="text-xs text-fg-muted">{calendar.event_count}</span>
                    )}
                  </label>
                ))}
                
                {calendars.length === 0 && (
                  <div className="text-sm text-fg-muted">No calendars created yet</div>
                )}
              </div>
            )}
          </div>

          {/* Event types section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-fg-muted">Event Types</h4>
              <button
                onClick={toggleAllEventTypes}
                className="text-xs text-blue-600 hover:underline"
              >
                {selectedEventTypes.size === EVENT_TYPES.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(type => (
                <label
                  key={type.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-bg-subtle p-1.5 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedEventTypes.has(type.id)}
                    onChange={() => toggleEventType(type.id)}
                    className="rounded border-border"
                  />
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm truncate">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected count */}
          <div className="text-xs text-fg-muted pt-2 border-t border-border">
            {selectedCalendars.size} calendar{selectedCalendars.size !== 1 ? 's' : ''} selected
            {' • '}
            {selectedEventTypes.size} event type{selectedEventTypes.size !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { Calendar } from '../../types/calendar';

export function EventForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState('#3B82F6');
  const [eventType, setEventType] = useState('event');
  const [timeBlockType, setTimeBlockType] = useState('');
  const [calendar, setCalendar] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [priority, setPriority] = useState(0);
  const [calendars, setCalendars] = useState<Calendar[]>([]);

  const EVENT_TYPES = [
    { id: 'event', label: 'Event' },
    { id: 'meeting', label: 'Meeting' },
    { id: 'appointment', label: 'Appointment' },
    { id: 'deadline', label: 'Deadline' },
    { id: 'time_block', label: 'Time Block' },
    { id: 'task', label: 'Task' },
    { id: 'habit', label: 'Habit' },
    { id: 'reminder', label: 'Reminder' },
  ];

  const TIME_BLOCK_TYPES = [
    { id: 'deep_work', label: 'Deep Work' },
    { id: 'meeting', label: 'Meeting' },
    { id: 'break', label: 'Break' },
    { id: 'buffer', label: 'Buffer Time' },
    { id: 'focus', label: 'Focus Time' },
    { id: 'review', label: 'Review' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    try {
      const response = await calendarApi.getCalendars();
      setCalendars(response.data);
      // Select default calendar if available
      const defaultCal = response.data.find((c: Calendar) => c.is_default);
      if (defaultCal) {
        setCalendar(defaultCal.id);
      } else if (response.data.length > 0) {
        setCalendar(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load calendars');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData: any = {
        title,
        description,
        start_date: startDate,
        start_time: isAllDay ? null : startTime,
        end_date: startDate,
        end_time: isAllDay ? null : endTime,
        is_all_day: isAllDay,
        color,
        event_type: eventType,
        priority,
      };

      if (timeBlockType) {
        eventData.time_block_type = timeBlockType;
      }

      if (calendar) {
        eventData.calendar = calendar;
      }

      if (location) {
        eventData.location = location;
      }

      if (meetingLink) {
        eventData.meeting_link = meetingLink;
      }

      await calendarApi.createEvent(eventData);
      onSuccess();
      setTitle('');
      setDescription('');
      setLocation('');
      setMeetingLink('');
      setPriority(0);
    } catch (error) {
      console.error('Failed to create event');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bg-elevated rounded-[var(--radius)] shadow-soft border border-border p-5 mb-6">
      <h3 className="font-semibold mb-4">Add Event</h3>
      
      <div className="space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title..."
          className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          required
        />
        
        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)..."
          className="w-full p-2 border border-border rounded-md bg-background text-foreground"
          rows={2}
        />
        
        {/* Date and Time */}
        <div className="flex flex-wrap gap-4">
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
        
        {/* All day toggle */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.checked)}
          />
          <span className="text-sm">All day event</span>
        </label>
        
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full p-2 border border-border rounded-md bg-background"
          >
            {EVENT_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Time Block Type (only for time_block events) */}
        {eventType === 'time_block' && (
          <div>
            <label className="block text-sm font-medium mb-2">Time Block Type</label>
            <select
              value={timeBlockType}
              onChange={(e) => setTimeBlockType(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="">Select type...</option>
              {TIME_BLOCK_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Calendar */}
        {calendars.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Calendar</label>
            <select
              value={calendar}
              onChange={(e) => setCalendar(e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Location (for meetings/appointments) */}
        {(eventType === 'meeting' || eventType === 'appointment') && (
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)..."
            className="w-full p-2 border border-border rounded-md bg-background"
          />
        )}

        {/* Meeting Link (for meetings) */}
        {eventType === 'meeting' && (
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="Meeting link (e.g., Zoom, Meet)..."
            className="w-full p-2 border border-border rounded-md bg-background"
          />
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-md border transition-smooth ${
                  priority === p ? 'border-foreground bg-bg-subtle' : 'border-border'
                }`}
              >
                {p === 0 ? 'None' : p === 1 ? 'Low' : p === 2 ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-ring' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
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

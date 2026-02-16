import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { ScheduleAnalytics } from '../../types/calendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#F97316', '#6B7280'];

export function ScheduleAnalytics() {
  const [analytics, setAnalytics] = useState<ScheduleAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }
    
    try {
      const response = await calendarApi.getAnalytics({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.hours_by_event_type).map(([type, hours]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      hours: Number(hours.toFixed(2)),
    }));
  };

  const getCalendarData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.hours_by_calendar).map(([name, hours]) => ({
      name,
      hours: Number(hours.toFixed(2)),
    }));
  };

  if (loading) {
    return (
      <div className="bg-bg-elevated rounded-[var(--radius)] border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-bg-elevated rounded-[var(--radius)] border border-border p-6">
        <div className="text-center text-fg-muted">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  const eventTypeData = getEventTypeData();
  const calendarData = getCalendarData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Schedule Analytics</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded text-sm transition-smooth ${
              period === 'week' ? 'bg-foreground text-background' : 'border border-border hover:bg-bg-subtle'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded text-sm transition-smooth ${
              period === 'month' ? 'bg-foreground text-background' : 'border border-border hover:bg-bg-subtle'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Total Events</div>
          <div className="text-2xl font-bold mt-1">{analytics.total_events}</div>
        </div>
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Total Hours</div>
          <div className="text-2xl font-bold mt-1">{analytics.total_hours.toFixed(1)}h</div>
        </div>
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Meetings</div>
          <div className="text-2xl font-bold mt-1">{analytics.meeting_count}</div>
        </div>
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Avg Meeting Duration</div>
          <div className="text-2xl font-bold mt-1">
            {analytics.average_meeting_duration > 0 
              ? `${Math.floor(analytics.average_meeting_duration)}m` 
              : '0m'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hours by Event Type */}
        {eventTypeData.length > 0 && (
          <div className="bg-bg-subtle rounded-lg p-4">
            <h4 className="font-medium mb-4">Hours by Event Type</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}h`}
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="hours" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Hours by Calendar */}
        {calendarData.length > 0 && (
          <div className="bg-bg-subtle rounded-lg p-4">
            <h4 className="font-medium mb-4">Hours by Calendar</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={calendarData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {calendarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}h`}
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Free Time</div>
          <div className="text-xl font-bold mt-1">{analytics.free_time_hours.toFixed(1)}h</div>
          <div className="text-xs text-fg-muted mt-1">
            Available in period
          </div>
        </div>
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Time Blocks</div>
          <div className="text-xl font-bold mt-1">{analytics.time_block_hours.toFixed(1)}h</div>
          <div className="text-xs text-fg-muted mt-1">
            Deep work, focus time, etc.
          </div>
        </div>
        <div className="bg-bg-subtle rounded-lg p-4">
          <div className="text-sm text-fg-muted">Busiest Day</div>
          <div className="text-xl font-bold mt-1">
            {analytics.busiest_day 
              ? new Date(analytics.busiest_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'N/A'}
          </div>
          <div className="text-xs text-fg-muted mt-1">
            {analytics.busiest_day_hours.toFixed(1)}h scheduled
          </div>
        </div>
      </div>
    </div>
  );
}

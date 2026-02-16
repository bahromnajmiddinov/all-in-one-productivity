import { useState, useEffect } from 'react';
import { calendarApi } from '../../api';
import type { HeatmapData } from '../../types/calendar';

export function CalendarHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadHeatmapData();
  }, [days]);

  const loadHeatmapData = async () => {
    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      const response = await calendarApi.getHeatmap({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      });
      setHeatmapData(response.data);
    } catch (error) {
      console.error('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    // Scale from light blue (low) to dark blue (high)
    if (intensity === 0) return 'var(--bg-subtle)';
    const alpha = 0.15 + (intensity * 0.85); // 0.15 to 1.0
    return `rgba(59, 130, 246, ${alpha})`;
  };

  const getIntensityLevel = (intensity: number) => {
    if (intensity === 0) return 'No events';
    if (intensity < 0.25) return 'Light';
    if (intensity < 0.5) return 'Moderate';
    if (intensity < 0.75) return 'Busy';
    return 'Very busy';
  };

  const getWeeks = () => {
    const weeks: HeatmapData[][] = [];
    let currentWeek: HeatmapData[] = [];
    
    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      
      // Check if it's the last day of the week (Sunday)
      const date = new Date(day.date);
      if (date.getDay() === 6 || index === heatmapData.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const weeks = getWeeks();
  const maxHours = Math.max(...heatmapData.map(d => d.total_hours), 0);
  const avgHours = heatmapData.length > 0 
    ? heatmapData.reduce((sum, d) => sum + d.total_hours, 0) / heatmapData.length 
    : 0;

  if (loading) {
    return (
      <div className="bg-bg-elevated rounded-[var(--radius)] border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated rounded-[var(--radius)] border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Calendar Heatmap</h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1 border border-border rounded-md bg-bg-subtle"
        >
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="text-sm">
          <span className="text-fg-muted">Average:</span>{' '}
          <span className="font-medium">{avgHours.toFixed(1)}h/day</span>
        </div>
        <div className="text-sm">
          <span className="text-fg-muted">Peak:</span>{' '}
          <span className="font-medium">{maxHours.toFixed(1)}h</span>
        </div>
        <div className="text-sm">
          <span className="text-fg-muted">Active days:</span>{' '}
          <span className="font-medium">{heatmapData.filter(d => d.total_hours > 0).length}</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-max">
          {/* Day labels */}
          <div className="flex mb-1 ml-8">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="w-3 h-4 text-[10px] text-fg-muted flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap weeks */}
          <div className="flex gap-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {/* Week number label */}
                {weekIndex % 2 === 0 && (
                  <div className="h-3 w-6 text-[10px] text-fg-muted flex items-center">
                    {Math.floor(weekIndex / 4) + 1}
                  </div>
                )}
                {weekIndex % 2 !== 0 && <div className="h-3 w-6" />}

                {/* Days */}
                {week.map((day, dayIndex) => {
                  const date = new Date(day.date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  
                  return (
                    <div
                      key={day.date}
                      className="w-3 h-3 rounded-sm relative group cursor-pointer"
                      style={{ backgroundColor: getIntensityColor(day.intensity) }}
                      title={`
                        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        ${day.total_hours.toFixed(1)}h · ${day.event_count} events
                        ${day.event_count > 0 ? `(${getIntensityLevel(day.intensity)})` : ''}
                      `}
                    >
                      {isToday && (
                        <div className="absolute inset-0 border-2 border-blue-600 rounded-sm pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-4">
        <span className="text-xs text-fg-muted mr-2">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
          <div
            key={intensity}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getIntensityColor(intensity) }}
            title={getIntensityLevel(intensity)}
          />
        ))}
        <span className="text-xs text-fg-muted ml-2">More</span>
      </div>

      {/* Event type breakdown */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="font-medium mb-3">Event Type Distribution</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            heatmapData.reduce((acc, day) => {
              Object.entries(day.event_types).forEach(([type, count]) => {
                acc[type] = (acc[type] || 0) + count;
              });
              return acc;
            }, {} as Record<string, number>)
          ).map(([type, count]) => (
            <div
              key={type}
              className="px-2 py-1 bg-bg-subtle rounded text-xs"
            >
              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

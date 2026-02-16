import { useState } from 'react';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { DayView } from '../components/calendar/DayView';
import { YearView } from '../components/calendar/YearView';
import { AgendaView } from '../components/calendar/AgendaView';
import { EventForm } from '../components/calendar/EventForm';
import { CalendarLayers } from '../components/calendar/CalendarLayers';
import { ScheduleAnalytics } from '../components/calendar/ScheduleAnalytics';
import { CalendarHeatmap } from '../components/calendar/CalendarHeatmap';
import { Button } from '../components/ui/Button';
import { Plus, BarChart3, Layers } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day' | 'year' | 'agenda' | 'analytics' | 'heatmap';

export function Calendar() {
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [showForm, setShowForm] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
    setShowForm(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-content mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1">Calendar</h1>
          <p className="text-body mt-1">Events and time blocking.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Standard views */}
          {(['month', 'week', 'day', 'year', 'agenda'] as ViewType[]).map((view) => (
            <Button
              key={view}
              variant={currentView === view ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setCurrentView(view)}
            >
              {view}
            </Button>
          ))}
          
          {/* Analytics views */}
          <Button
            variant={currentView === 'analytics' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCurrentView('analytics')}
          >
            <BarChart3 className="size-4 mr-1.5" strokeWidth={1.5} />
            Analytics
          </Button>
          <Button
            variant={currentView === 'heatmap' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCurrentView('heatmap')}
          >
            Heatmap
          </Button>
          
          {/* Tools */}
          <Button
            variant={showLayers ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowLayers(!showLayers)}
          >
            <Layers className="size-4 mr-1.5" strokeWidth={1.5} />
            Layers
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
            Event
          </Button>
        </div>
      </div>

      {/* Calendar Layers Sidebar */}
      {showLayers && (
        <div className="mb-6">
          <CalendarLayers />
        </div>
      )}

      {/* Event Form */}
      {showForm && <EventForm onSuccess={refresh} />}

      {/* Views */}
      {currentView === 'month' && <MonthView key={refreshKey} />}
      {currentView === 'week' && <WeekView key={refreshKey} />}
      {currentView === 'day' && <DayView key={refreshKey} />}
      {currentView === 'year' && <YearView key={refreshKey} />}
      {currentView === 'agenda' && <AgendaView key={refreshKey} />}
      {currentView === 'analytics' && <ScheduleAnalytics />}
      {currentView === 'heatmap' && <CalendarHeatmap />}
    </div>
  );
}

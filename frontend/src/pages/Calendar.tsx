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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Plus, BarChart3, Layers, Calendar as CalendarIcon, Grid3X3, List, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

type ViewType = 'month' | 'week' | 'day' | 'year' | 'agenda' | 'analytics' | 'heatmap';

const viewConfig = [
  { id: 'month' as ViewType, label: 'Month', icon: Grid3X3 },
  { id: 'week' as ViewType, label: 'Week', icon: CalendarIcon },
  { id: 'day' as ViewType, label: 'Day', icon: Clock },
  { id: 'agenda' as ViewType, label: 'Agenda', icon: List },
] as const;

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
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-[var(--radius)] bg-accent-subtle text-accent">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h1 className="text-h1">Calendar</h1>
          </div>
          <p className="text-body max-w-2xl">
            Events and time blocking. Manage your schedule and plan your time effectively.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex bg-bg-subtle rounded-[var(--radius-sm)] p-1">
            {viewConfig.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-fast',
                    currentView === view.id
                      ? 'bg-bg-elevated shadow-sm text-foreground'
                      : 'text-fg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Additional Views */}
          <Button
            variant={currentView === 'analytics' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCurrentView('analytics')}
          >
            <BarChart3 className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
            Analytics
          </Button>
          
          {/* Tools */}
          <Button
            variant={showLayers ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowLayers(!showLayers)}
          >
            <Layers className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
            Layers
          </Button>
          
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
            Event
          </Button>
        </div>
      </div>

      {/* Calendar Layers Sidebar */}
      {showLayers && (
        <div className="mb-6 animate-slide-in-top">
          <CalendarLayers />
        </div>
      )}

      {/* Views */}
      <div className="animate-fade-in">
        {currentView === 'month' && <MonthView key={refreshKey} />}
        {currentView === 'week' && <WeekView key={refreshKey} />}
        {currentView === 'day' && <DayView key={refreshKey} />}
        {currentView === 'year' && <YearView key={refreshKey} />}
        {currentView === 'agenda' && <AgendaView key={refreshKey} />}
        {currentView === 'analytics' && <ScheduleAnalytics />}
        {currentView === 'heatmap' && <CalendarHeatmap />}
      </div>

      {/* Event Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <EventForm onSuccess={refresh} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

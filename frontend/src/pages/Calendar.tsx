import { useState } from 'react';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { EventForm } from '../components/calendar/EventForm';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export function Calendar() {
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [showForm, setShowForm] = useState(false);
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
        <div className="flex items-center gap-2">
          {(['month', 'week', 'day', 'agenda'] as ViewType[]).map((view) => (
            <Button
              key={view}
              variant={currentView === view ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setCurrentView(view)}
            >
              {view}
            </Button>
          ))}
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="size-4 mr-1.5" strokeWidth={1.5} />
            Event
          </Button>
        </div>
      </div>

      {showForm && <EventForm onSuccess={refresh} />}

      {currentView === 'month' && <MonthView key={refreshKey} />}
      {currentView === 'week' && <WeekView key={refreshKey} />}
      {currentView === 'day' && (
        <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-8 text-center text-fg-muted">
          Day view coming soon
        </div>
      )}
      {currentView === 'agenda' && (
        <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-8 text-center text-fg-muted">
          Agenda view coming soon
        </div>
      )}
    </div>
  );
}

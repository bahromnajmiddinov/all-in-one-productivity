import { useState } from 'react';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { EventForm } from '../components/calendar/EventForm';

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
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex gap-2">
          {(['month', 'week', 'day', 'agenda'] as ViewType[]).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-4 py-2 rounded capitalize ${
                currentView === view
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {view}
            </button>
          ))}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + Event
          </button>
        </div>
      </div>

      {showForm && <EventForm onSuccess={refresh} />}
      
      {currentView === 'month' && <MonthView key={refreshKey} />}
      {currentView === 'week' && <WeekView key={refreshKey} />}
      {currentView === 'day' && <div>Day view coming soon</div>}
      {currentView === 'agenda' && <div>Agenda view coming soon</div>}
    </div>
  );
}
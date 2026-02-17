import { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import type {
  WaterAnalytics,
  WaterContainer,
  WaterCorrelations,
  WaterDailyStats,
  WaterReminder,
  WaterSettings,
  WaterStreaks,
  WaterTimelineEntry,
  WaterTrends,
} from '../../types/health';

const ML_PER_OUNCE = 29.5735;

export function WaterTracker() {
  const [stats, setStats] = useState<WaterDailyStats | null>(null);
  const [settings, setSettings] = useState<WaterSettings | null>(null);
  const [timeline, setTimeline] = useState<WaterTimelineEntry[]>([]);
  const [trends, setTrends] = useState<WaterTrends | null>(null);
  const [streaks, setStreaks] = useState<WaterStreaks | null>(null);
  const [analytics, setAnalytics] = useState<WaterAnalytics | null>(null);
  const [reminder, setReminder] = useState<WaterReminder | null>(null);
  const [correlations, setCorrelations] = useState<WaterCorrelations | null>(null);
  const [containers, setContainers] = useState<WaterContainer[]>([]);
  const [quickAmount, setQuickAmount] = useState(250);
  const [containerName, setContainerName] = useState('');
  const [containerVolume, setContainerVolume] = useState(350);
  const [goalInput, setGoalInput] = useState(2500);
  const [temperatureInput, setTemperatureInput] = useState<number | ''>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, settingsRes, timelineRes, trendsRes, streaksRes, analyticsRes, reminderRes, correlationsRes, containersRes] =
        await Promise.all([
          healthApi.getWaterToday(),
          healthApi.getWaterSettings(),
          healthApi.getWaterTimeline(),
          healthApi.getWaterTrends(),
          healthApi.getWaterStreaks(),
          healthApi.getWaterAnalytics(),
          healthApi.getWaterReminder(),
          healthApi.getWaterCorrelations(),
          healthApi.getWaterContainers(),
        ]);

      setStats(todayRes.data);
      setSettings(settingsRes.data);
      setTimeline(timelineRes.data);
      setTrends(trendsRes.data);
      setStreaks(streaksRes.data);
      setAnalytics(analyticsRes.data);
      setReminder(reminderRes.data);
      setCorrelations(correlationsRes.data);
      setContainers(containersRes.data);

      const unit = settingsRes.data.goal_unit;
      const displayGoal = unit === 'oz'
        ? Math.round(settingsRes.data.daily_goal_ml / ML_PER_OUNCE)
        : settingsRes.data.daily_goal_ml;
      setGoalInput(displayGoal);
      setQuickAmount(unit === 'oz' ? 8 : 250);
      setContainerVolume(unit === 'oz' ? 12 : 350);
      setTemperatureInput(settingsRes.data.temperature_c ?? '');
    } catch (error) {
      console.error('Failed to load water data');
    }
  };

  const addWater = async (amount: number, containerId?: string | null) => {
    if (!amount) {
      return;
    }
    const unit = settings?.goal_unit ?? 'ml';
    const amountMl = unit === 'oz' ? Math.round(amount * ML_PER_OUNCE) : amount;
    await healthApi.addWaterLog(amountMl, containerId);
    loadData();
  };

  const updateSettings = async (updates: Partial<WaterSettings>) => {
    if (!settings) {
      return;
    }
    const { adjusted_goal_ml, ...payload } = settings;
    const response = await healthApi.updateWaterSettings({
      ...payload,
      ...updates,
    });
    setSettings(response.data);
  };

  const saveGoal = async () => {
    const unit = settings?.goal_unit ?? 'ml';
    const goalMl = unit === 'oz' ? Math.round(goalInput * ML_PER_OUNCE) : goalInput;
    await updateSettings({ daily_goal_ml: goalMl });
    loadData();
  };

  const handleUnitChange = async (newUnit: WaterSettings['goal_unit']) => {
    if (!settings || newUnit === settings.goal_unit) {
      return;
    }
    const currentGoalMl = settings.goal_unit === 'oz'
      ? Math.round(goalInput * ML_PER_OUNCE)
      : goalInput;
    const displayGoal = newUnit === 'oz'
      ? Math.round(currentGoalMl / ML_PER_OUNCE)
      : currentGoalMl;
    setGoalInput(displayGoal);
    setQuickAmount(newUnit === 'oz' ? 8 : 250);
    setContainerVolume(newUnit === 'oz' ? 12 : 350);
    await updateSettings({ goal_unit: newUnit });
  };

  const createContainer = async () => {
    if (!containerName || !containerVolume) {
      return;
    }
    const unit = settings?.goal_unit ?? 'ml';
    const volumeMl = unit === 'oz' ? Math.round(containerVolume * ML_PER_OUNCE) : containerVolume;
    await healthApi.createWaterContainer({
      name: containerName,
      volume_ml: volumeMl,
      is_favorite: true,
    });
    setContainerName('');
    loadData();
  };

  if (!stats || !settings) {
    return <div>Loading...</div>;
  }

  const unit = settings.goal_unit;
  const unitLabel = unit === 'oz' ? 'oz' : 'ml';
  const toDisplay = (amountMl: number) =>
    unit === 'oz' ? Math.round(amountMl / ML_PER_OUNCE) : amountMl;
  const quickAmounts = unit === 'oz' ? [5, 8, 12] : [150, 250, 500];

  const percentage = stats.percentage;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const maxTimelineValue = Math.max(1, ...timeline.map((entry) => entry.total_ml));
  const adjustedGoal = settings.adjusted_goal_ml || settings.daily_goal_ml;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Water Intake</h3>
          <p className="text-sm text-gray-500">Track daily hydration with smart goals and insights.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="relative w-48 h-48 mx-auto">
            <svg className="transform -rotate-90 w-full h-full">
              <circle cx="96" cy="96" r="90" stroke="#e5e7eb" strokeWidth="12" fill="none" />
              <circle
                cx="96"
                cy="96"
                r="90"
                stroke="#3B82F6"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                style={{ strokeDasharray: circumference, strokeDashoffset }}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{toDisplay(stats.total_ml)}{unitLabel}</span>
              <span className="text-sm text-gray-500">/ {toDisplay(adjustedGoal)}{unitLabel}</span>
              <span className="text-lg text-blue-600 font-semibold">{percentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => addWater(amount)}
                className="py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                +{amount}{unitLabel}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={quickAmount}
              onChange={(event) => setQuickAmount(Number(event.target.value))}
              className="flex-1 border rounded px-3 py-2"
              placeholder={`Custom amount (${unitLabel})`}
              min={0}
            />
            <button
              onClick={() => addWater(quickAmount)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>

          {containers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Favorite containers</h4>
              <div className="grid grid-cols-2 gap-2">
                {containers.map((container) => (
                  <button
                    key={container.id}
                    onClick={() => addWater(toDisplay(container.volume_ml), container.id)}
                    className="py-2 px-3 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                  >
                    {container.name} • {toDisplay(container.volume_ml)}{unitLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stats.remaining_ml > 0 && (
            <p className="text-center text-sm text-gray-500">
              {toDisplay(stats.remaining_ml)}{unitLabel} more to reach your goal!
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold">{streaks?.current_streak ?? 0}</div>
              <div className="text-sm text-gray-500">Current streak</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold">{analytics?.hydration_score ?? 0}%</div>
              <div className="text-sm text-gray-500">Hydration score</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold">{toDisplay(trends?.weekly_average_ml ?? 0)}{unitLabel}</div>
              <div className="text-sm text-gray-500">Weekly avg</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold">{toDisplay(trends?.monthly_average_ml ?? 0)}{unitLabel}</div>
              <div className="text-sm text-gray-500">Monthly avg</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Today&apos;s intake timeline</h4>
            <div className="flex items-end gap-1 h-24">
              {timeline.map((entry) => (
                <div key={entry.hour} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-300 rounded-t"
                    style={{ height: `${(entry.total_ml / maxTimelineValue) * 100}%` }}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">{entry.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-base font-semibold">Daily goal settings</h4>
          <div className="flex gap-2">
            <input
              type="number"
              value={goalInput}
              onChange={(event) => setGoalInput(Number(event.target.value))}
              className="flex-1 border rounded px-3 py-2"
            />
            <select
              value={settings.goal_unit}
              onChange={(event) => handleUnitChange(event.target.value as WaterSettings['goal_unit'])}
              className="border rounded px-3 py-2"
            >
              <option value="ml">ml</option>
              <option value="oz">oz</option>
            </select>
            <button
              onClick={saveGoal}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={settings.weather_adjustment_enabled}
              onChange={(event) => updateSettings({ weather_adjustment_enabled: event.target.checked })}
            />
            <span>Adjust goal for weather & activity</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={temperatureInput}
              onChange={(event) => setTemperatureInput(event.target.value === '' ? '' : Number(event.target.value))}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Temperature °C"
            />
            <select
              value={settings.activity_level}
              onChange={(event) => updateSettings({ activity_level: event.target.value as WaterSettings['activity_level'] })}
              className="border rounded px-3 py-2"
            >
              <option value="low">Low activity</option>
              <option value="moderate">Moderate activity</option>
              <option value="high">High activity</option>
            </select>
            <button
              onClick={() => updateSettings({ temperature_c: temperatureInput === '' ? null : temperatureInput })}
              className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Update
            </button>
          </div>
          <p className="text-sm text-gray-500">Adjusted goal: {toDisplay(adjustedGoal)}{unitLabel}</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-base font-semibold">Reminders & containers</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={settings.reminder_enabled}
              onChange={(event) => updateSettings({ reminder_enabled: event.target.checked })}
            />
            <span>Enable reminders</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={settings.smart_reminders_enabled}
              onChange={(event) => updateSettings({ smart_reminders_enabled: event.target.checked })}
            />
            <span>Smart reminder timing</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={settings.reminder_interval}
              onChange={(event) => updateSettings({ reminder_interval: Number(event.target.value) })}
              className="flex-1 border rounded px-3 py-2"
            />
            <span className="self-center text-sm text-gray-500">minutes</span>
          </div>
          <p className="text-sm text-gray-500">
            Next reminder: {reminder?.next_reminder_at ? new Date(reminder.next_reminder_at).toLocaleTimeString() : '—'}
          </p>

          <div className="space-y-2">
            <h5 className="text-sm font-semibold text-gray-700">Add container</h5>
            <div className="flex gap-2">
              <input
                type="text"
                value={containerName}
                onChange={(event) => setContainerName(event.target.value)}
                className="flex-1 border rounded px-3 py-2"
                placeholder="Container name"
              />
              <input
                type="number"
                value={containerVolume}
                onChange={(event) => setContainerVolume(Number(event.target.value))}
                className="w-28 border rounded px-3 py-2"
                placeholder={unitLabel}
              />
              <button
                onClick={createContainer}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Hydration streaks</h4>
          <p className="text-sm text-gray-500">Current: {streaks?.current_streak ?? 0} days</p>
          <p className="text-sm text-gray-500">Best (30d): {streaks?.best_streak ?? 0} days</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Consistency</h4>
          <p className="text-sm text-gray-500">Days met goal: {analytics?.days_met_goal ?? 0} / 30</p>
          <p className="text-sm text-gray-500">Avg intake: {toDisplay(analytics?.average_daily_ml ?? 0)}{unitLabel}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Hydration trends</h4>
          <p className="text-sm text-gray-500">Weekly avg: {toDisplay(trends?.weekly_average_ml ?? 0)}{unitLabel}</p>
          <p className="text-sm text-gray-500">Monthly avg: {toDisplay(trends?.monthly_average_ml ?? 0)}{unitLabel}</p>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Hydration correlations</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Mood', value: correlations?.mood },
            { label: 'Energy', value: correlations?.energy },
            { label: 'Productivity', value: correlations?.productivity },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="text-lg font-semibold">
                {item.value?.coefficient ?? '—'}
              </div>
              <div className="text-xs text-gray-400">
                {item.value?.data_points ?? 0} data points
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

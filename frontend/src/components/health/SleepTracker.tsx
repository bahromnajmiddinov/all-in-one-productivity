import { useEffect, useState } from 'react';
import { healthApi } from '../../api';
import type {
  SleepLog,
  SleepStats,
  SleepNap,
  SleepHeatmapEntry,
  SleepTrends,
  SleepConsistency,
  SleepOptimalWindow,
  SleepCorrelations,
} from '../../types/health';

export function SleepTracker() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [naps, setNaps] = useState<SleepNap[]>([]);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights' | 'naps'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsResponse, statsResponse, napsResponse] = await Promise.all([
        healthApi.getSleepLogs(),
        healthApi.getSleepAnalytics(),
        healthApi.getSleepNaps(),
      ]);
      setLogs(logsResponse.data);
      setStats(statsResponse.data);
      setNaps(napsResponse.data);
    } catch (error) {
      console.error('Failed to load sleep data');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityEmoji = (quality: number) => {
    if (quality >= 8) return '😴';
    if (quality >= 6) return '😊';
    if (quality >= 4) return '😐';
    return '😪';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Sleep Tracker</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddLog(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Add Sleep Log
          </button>
          <button
            onClick={() => setShowAnalytics(true)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <div className="text-2xl font-bold text-indigo-600">
            {stats?.avg_duration_7d_hours || 0}h
          </div>
          <div className="text-xs text-gray-600 mt-1">Avg Duration (7d)</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {stats?.avg_quality_7d?.toFixed(1) || 0}/10
          </div>
          <div className="text-xs text-gray-600 mt-1">Avg Quality (7d)</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className={`text-2xl font-bold ${getScoreColor(stats?.avg_score_7d || 0)}`}>
            {stats?.avg_score_7d?.toFixed(0) || 0}
          </div>
          <div className="text-xs text-gray-600 mt-1">Sleep Score (7d)</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats?.current_streak || 0}
          </div>
          <div className="text-xs text-gray-600 mt-1">Day Streak</div>
        </div>
      </div>

      {/* Sleep Debt */}
      {stats && stats.sleep_debt_minutes > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-red-800">Sleep Debt</div>
              <div className="text-xs text-red-600">You need more sleep</div>
            </div>
            <div className="text-xl font-bold text-red-600">
              {stats.sleep_debt_hours}h deficit
            </div>
          </div>
        </div>
      )}

      {/* Recent Sleep Logs */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-3">Recent Sleep</div>
        {logs.slice(0, 5).map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-lg">{getQualityEmoji(log.quality)}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {log.duration_hours}h • Quality: {log.quality}/10
                {log.sleep_score && ` • Score: ${log.sleep_score.toFixed(0)}`}
              </div>
              {log.disruptions_count > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  {log.disruptions_count} disruption{log.disruptions_count > 1 ? 's' : ''}
                </div>
              )}
            </div>
            {log.sleep_score && (
              <div className={`text-2xl font-bold ${getScoreColor(log.sleep_score)}`}>
                {log.sleep_score.toFixed(0)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Naps */}
      {naps.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-700 mb-3">Recent Naps</div>
          <div className="space-y-2">
            {naps.slice(0, 3).map((nap) => (
              <div key={nap.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">
                    {new Date(nap.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {nap.duration_hours}h • {nap.feeling_after_label}
                  </div>
                </div>
                {nap.quality && (
                  <div className="text-sm font-medium text-yellow-700">{nap.quality}/10</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Sleep Log Modal */}
      {showAddLog && (
        <SleepLogModal
          onClose={() => setShowAddLog(false)}
          onSave={loadData}
        />
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <SleepAnalyticsModal
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
}

interface SleepLogModalProps {
  onClose: () => void;
  onSave: () => void;
}

function SleepLogModal({ onClose, onSave }: SleepLogModalProps) {
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [quality, setQuality] = useState(7);
  const [disruptions, setDisruptions] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await healthApi.createSleepLog({
        bed_time: bedTime,
        wake_time: wakeTime,
        quality: quality,
        disruptions_count: disruptions,
        notes: notes,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to create sleep log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Log Sleep</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bed Time
            </label>
            <input
              type="datetime-local"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wake Time
            </label>
            <input
              type="datetime-local"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sleep Quality: {quality}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 - Terrible</span>
              <span>10 - Excellent</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disruptions
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={disruptions}
              onChange={(e) => setDisruptions(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SleepAnalyticsModalProps {
  onClose: () => void;
}

function SleepAnalyticsModal({ onClose }: SleepAnalyticsModalProps) {
  const [trends, setTrends] = useState<SleepTrends | null>(null);
  const [consistency, setConsistency] = useState<SleepConsistency | null>(null);
  const [optimalWindow, setOptimalWindow] = useState<SleepOptimalWindow | null>(null);
  const [correlations, setCorrelations] = useState<SleepCorrelations | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'consistency' | 'correlations'>('trends');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [trendsRes, consistencyRes, windowRes, corrRes] = await Promise.all([
        healthApi.getSleepTrends(30),
        healthApi.getSleepConsistency(30),
        healthApi.getSleepOptimalWindow(),
        healthApi.getSleepCorrelations(30),
      ]);
      setTrends(trendsRes.data);
      setConsistency(consistencyRes.data);
      setOptimalWindow(windowRes.data);
      setCorrelations(corrRes.data);
    } catch (error) {
      console.error('Failed to load analytics');
    }
  };

  const getCorrelationStrength = (coef: number | null) => {
    if (coef === null) return { label: 'No data', color: 'gray' };
    const abs = Math.abs(coef);
    if (abs >= 0.7) return { label: 'Strong', color: 'green' };
    if (abs >= 0.4) return { label: 'Moderate', color: 'yellow' };
    return { label: 'Weak', color: 'red' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Sleep Analytics</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'trends'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'consistency'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Consistency
          </button>
          <button
            onClick={() => setActiveTab('correlations')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'correlations'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Correlations
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'trends' && trends && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Duration Trends (Last 30 Days)</h4>
                <div className="h-48 bg-gray-50 rounded-lg p-4 flex items-end gap-1">
                  {trends.duration.slice(-14).map((entry, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                      style={{
                        height: `${Math.min((entry.duration_hours / 12) * 100, 100)}%`,
                      }}
                      title={`${entry.date}: ${entry.duration_hours}h`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Trends (Last 30 Days)</h4>
                <div className="h-48 bg-gray-50 rounded-lg p-4 flex items-end gap-1">
                  {trends.quality.slice(-14).map((entry, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                      style={{
                        height: `${(entry.quality / 10) * 100}%`,
                      }}
                      title={`${entry.date}: ${entry.quality}/10`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consistency' && consistency && optimalWindow && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-gray-600">Consistency Score</div>
                  <div className="text-3xl font-bold text-indigo-600 mt-1">
                    {consistency.consistency_score.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">out of 100</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Schedule Compliance</div>
                  <div className="text-3xl font-bold text-green-600 mt-1">
                    {consistency.schedule_compliance.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {consistency.days_on_schedule} of {consistency.total_days} days
                  </div>
                </div>
              </div>

              {optimalWindow.optimal_bed_time_start && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 mb-2">Optimal Sleep Window</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-yellow-600">
                      {optimalWindow.optimal_bed_time_start}
                    </div>
                    <span className="text-gray-600">to</span>
                    <div className="text-2xl font-bold text-yellow-600">
                      {optimalWindow.optimal_bed_time_end}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Based on {optimalWindow.data_points} data points • Avg score: {optimalWindow.avg_score.toFixed(0)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'correlations' && correlations && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Sleep vs. Other Metrics (Last 30 Days)</h4>

              {Object.entries(correlations).map(([key, value]) => {
                const strength = getCorrelationStrength(value.coefficient);
                const direction = value.coefficient && value.coefficient > 0 ? 'Positive' : value.coefficient && value.coefficient < 0 ? 'Negative' : 'None';
                const icon = value.coefficient && value.coefficient > 0 ? '📈' : value.coefficient && value.coefficient < 0 ? '📉' : '➖';

                return (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <div className="font-medium capitalize">{key}</div>
                        <div className="text-xs text-gray-500">
                          {value.data_points} data points
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium text-${strength.color}-600`}>
                        {strength.label} {direction}
                      </div>
                      <div className="text-lg font-bold">
                        {value.coefficient?.toFixed(3) || 'N/A'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

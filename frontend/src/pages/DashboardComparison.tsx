import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, Target, Activity, DollarSign, Smile } from 'lucide-react';

interface MetricComparison {
  id: string;
  metric_name: string;
  data_source: string;
  comparison_type: string;
  period1_start: string;
  period1_end: string;
  period1_value: number;
  period2_start: string;
  period2_end: string;
  period2_value: number;
  absolute_change: number;
  percentage_change: number;
  is_positive: boolean;
  is_significant: boolean;
  context_notes: string;
}

const METRICS = [
  { value: 'completed', label: 'Tasks Completed', source: 'tasks' },
  { value: 'completions', label: 'Habit Completions', source: 'habits' },
  { value: 'average', label: 'Average Mood', source: 'mood' },
  { value: 'duration', label: 'Exercise Duration', source: 'health_exercise' },
  { value: 'income', label: 'Income', source: 'finance' },
  { value: 'expenses', label: 'Expenses', source: 'finance' },
];

const COMPARISON_TYPES = [
  { value: 'wow', label: 'Week-over-Week' },
  { value: 'mom', label: 'Month-over-Month' },
  { value: 'yoy', label: 'Year-over-Year' },
];

export function DashboardComparison() {
  const [comparisons, setComparisons] = useState<MetricComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('completed');
  const [selectedSource, setSelectedSource] = useState('tasks');
  const [selectedType, setSelectedType] = useState('wow');

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/comparisons/');
      setComparisons(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComparison = async () => {
    try {
      setGenerating(true);
      const response = await api.get('/dashboard/comparisons/generate/', {
        params: {
          metric: selectedMetric,
          source: selectedSource,
          type: selectedType,
        },
      });
      setComparisons([response.data, ...comparisons]);
    } catch (error) {
      console.error('Failed to generate comparison:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getMetricIcon = (dataSource: string) => {
    switch (dataSource) {
      case 'tasks':
        return <Target className="h-4 w-4" />;
      case 'habits':
        return <Activity className="h-4 w-4" />;
      case 'mood':
        return <Smile className="h-4 w-4" />;
      case 'health_exercise':
        return <Activity className="h-4 w-4" />;
      case 'finance':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getComparisonTypeLabel = (type: string) => {
    const item = COMPARISON_TYPES.find(t => t.value === type);
    return item?.label || type;
  };

  const formatValue = (value: number, dataSource: string) => {
    if (dataSource === 'finance') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    if (dataSource === 'mood') {
      return value.toFixed(1);
    }
    return value.toLocaleString();
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Period Comparisons</h1>
          <p className="text-gray-600 mt-1">
            Compare metrics across different time periods to identify trends and patterns
          </p>
        </div>

        {/* Generate Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Metric</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.filter(m => m.source === selectedSource || selectedSource === 'all').map(metric => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Comparison Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPARISON_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={generateComparison}
                  disabled={generating}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate Comparison'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {comparisons.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Comparisons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisons.map(comparison => (
                <Card key={comparison.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {comparison.metric_name}
                      </CardTitle>
                      <Badge variant="outline">
                        {getComparisonTypeLabel(comparison.comparison_type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Period 1 */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {getComparisonTypeLabel(comparison.comparison_type).split('-')[0]} Period
                      </div>
                      <div className="text-2xl font-bold">
                        {formatValue(comparison.period1_value, comparison.data_source)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateRange(comparison.period1_start, comparison.period1_end)}
                      </div>
                    </div>

                    {/* Change Indicator */}
                    <div className={`flex items-center justify-center py-2 rounded-lg ${
                      comparison.is_positive ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {comparison.is_positive ? (
                        <ArrowUp className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <div>
                        <div className={`text-lg font-bold ${
                          comparison.is_positive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {comparison.is_positive ? '+' : ''}
                          {comparison.percentage_change.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {comparison.is_positive ? 'Increase' : 'Decrease'}
                        </div>
                      </div>
                    </div>

                    {/* Period 2 */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Previous Period
                      </div>
                      <div className="text-2xl font-bold text-gray-700">
                        {formatValue(comparison.period2_value, comparison.data_source)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateRange(comparison.period2_start, comparison.period2_end)}
                      </div>
                    </div>

                    {/* Significance Badge */}
                    {comparison.is_significant && (
                      <Badge variant="secondary" className="w-full justify-center">
                        Significant change detected
                      </Badge>
                    )}

                    {/* Context Notes */}
                    {comparison.context_notes && (
                      <div className="text-sm text-gray-600 border-t pt-3">
                        {comparison.context_notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comparisons yet</h3>
              <p className="text-gray-600">
                Generate a comparison to analyze metric trends across time periods
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

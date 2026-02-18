import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Activity, Target, Smile, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CorrelationAnalysis {
  id: string;
  metric1_name: string;
  metric1_source: string;
  metric2_name: string;
  metric2_source: string;
  correlation_coefficient: number;
  correlation_strength: string;
  sample_size: number;
  start_date: string;
  end_date: string;
  insights: any;
  recommendations: string[];
}

const METRIC_OPTIONS = [
  { value: 'completed', label: 'Tasks Completed', source: 'tasks', icon: Target },
  { value: 'completions', label: 'Habit Completions', source: 'habits', icon: Activity },
  { value: 'average', label: 'Average Mood', source: 'mood', icon: Smile },
  { value: 'duration', label: 'Exercise Duration', source: 'health_exercise', icon: Activity },
  { value: 'income', label: 'Income', source: 'finance', icon: DollarSign },
  { value: 'expenses', label: 'Expenses', source: 'finance', icon: DollarSign },
];

const TIME_RANGES = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
];

export function DashboardCorrelations() {
  const [correlations, setCorrelations] = useState<CorrelationAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [metric1, setMetric1] = useState('completed');
  const [source1, setSource1] = useState('tasks');
  const [metric2, setMetric2] = useState('average');
  const [source2, setSource2] = useState('mood');
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadCorrelations();
  }, []);

  const loadCorrelations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/correlations/');
      setCorrelations(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load correlations:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCorrelation = async () => {
    try {
      setAnalyzing(true);
      const response = await api.get('/dashboard/correlations/analyze/', {
        params: {
          metric1: metric1,
          source1: source1,
          metric2: metric2,
          source2: source2,
          days: timeRange,
        },
      });
      setCorrelations([response.data, ...correlations]);
    } catch (error) {
      console.error('Failed to analyze correlation:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getCorrelationIcon = (coefficient: number) => {
    if (coefficient > 0.3) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else if (coefficient < -0.3) {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    return <Minus className="h-5 w-5 text-gray-400" />;
  };

  const getCorrelationColor = (strength: string) => {
    if (strength.includes('positive')) {
      if (strength.includes('very_strong')) return 'bg-green-100 text-green-800 border-green-200';
      if (strength.includes('strong')) return 'bg-green-50 text-green-700 border-green-200';
      if (strength.includes('moderate')) return 'bg-green-50/50 text-green-600 border-green-100';
      return 'bg-green-50/25 text-green-500 border-green-50';
    } else if (strength.includes('negative')) {
      if (strength.includes('very_strong')) return 'bg-red-100 text-red-800 border-red-200';
      if (strength.includes('strong')) return 'bg-red-50 text-red-700 border-red-200';
      if (strength.includes('moderate')) return 'bg-red-50/50 text-red-600 border-red-100';
      return 'bg-red-50/25 text-red-500 border-red-50';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getCorrelationLabel = (strength: string) => {
    return strength
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getMetricIcon = (source: string) => {
    const metric = METRIC_OPTIONS.find(m => m.source === source);
    if (!metric) return <Activity className="h-4 w-4" />;
    const Icon = metric.icon;
    return <Icon className="h-4 w-4" />;
  };

  const formatMetricName = (name: string, source: string) => {
    const metric = METRIC_OPTIONS.find(m => m.value === name && m.source === source);
    return metric?.label || name;
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
          <h1 className="text-3xl font-bold">Correlation Analysis</h1>
          <p className="text-gray-600 mt-1">
            Discover relationships between different metrics in your life
          </p>
        </div>

        {/* Analyze Form */}
        <Card>
          <CardHeader>
            <CardTitle>Analyze Correlation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">First Metric</label>
                <Select value={metric1} onValueChange={setMetric1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_OPTIONS.filter(m => m.source === source1).map(metric => (
                      <SelectItem key={`${metric.value}-${metric.source}`} value={metric.value}>
                        <div className="flex items-center">
                          {getMetricIcon(metric.source)}
                          <span className="ml-2">{metric.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Source 1</label>
                <Select value={source1} onValueChange={setSource1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['tasks', 'habits', 'mood', 'health_exercise', 'finance'].map(source => (
                      <SelectItem key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Second Metric</label>
                <Select value={metric2} onValueChange={setMetric2}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_OPTIONS.filter(m => m.source === source2).map(metric => (
                      <SelectItem key={`${metric.value}-${metric.source}`} value={metric.value}>
                        <div className="flex items-center">
                          {getMetricIcon(metric.source)}
                          <span className="ml-2">{metric.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Source 2</label>
                <Select value={source2} onValueChange={setSource2}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['tasks', 'habits', 'mood', 'health_exercise', 'finance'].map(source => (
                      <SelectItem key={source} value={source}>
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={analyzeCorrelation}
                  disabled={analyzing}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Correlation Results */}
        {correlations.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Correlation Results</h2>
            <div className="space-y-4">
              {correlations.map(correlation => (
                <Card key={correlation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getCorrelationIcon(correlation.correlation_coefficient)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {formatMetricName(correlation.metric1_name, correlation.metric1_source)} ↔ {formatMetricName(correlation.metric2_name, correlation.metric2_source)}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{new Date(correlation.start_date).toLocaleDateString()}</span>
                            <span>to</span>
                            <span>{new Date(correlation.end_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{correlation.sample_size} data points</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={getCorrelationColor(correlation.correlation_strength)}
                      >
                        {getCorrelationLabel(correlation.correlation_strength)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Correlation Coefficient */}
                    <div className="flex items-center justify-center py-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold">
                          {correlation.correlation_coefficient > 0 ? '+' : ''}
                          {correlation.correlation_coefficient.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Correlation Coefficient
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Range: -1.0 to +1.0
                        </div>
                      </div>
                    </div>

                    {/* Interpretation */}
                    {correlation.insights?.interpretation && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-semibold mb-1">Interpretation</div>
                        <div className="text-sm text-gray-700">
                          {correlation.insights.interpretation}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {correlation.recommendations && correlation.recommendations.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Recommendations</div>
                        <ul className="space-y-2">
                          {correlation.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="text-primary mr-2">•</span>
                              {recommendation}
                            </li>
                          ))}
                        </ul>
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
              <h3 className="text-lg font-semibold mb-2">No correlations analyzed yet</h3>
              <p className="text-gray-600">
                Select two metrics and analyze their relationship over time
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

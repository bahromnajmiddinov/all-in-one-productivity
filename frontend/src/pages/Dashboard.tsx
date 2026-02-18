import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RefreshCw, Plus, Layout as LayoutIcon, BarChart3, TrendingUp, Activity, DollarSign, Target, BookOpen, Smile } from 'lucide-react';

interface Widget {
  id: string;
  widget_type: string;
  title: string;
  data_source: string;
  config: any;
  x: number;
  y: number;
  width: number;
  height: number;
  is_visible: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  dashboard_type: string;
  description: string;
  is_default: boolean;
  widgets: Widget[];
}

interface DashboardData {
  [widgetId: string]: any;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('master');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadDashboard('master');
  }, []);

  const loadDashboard = async (type: string) => {
    try {
      setLoading(true);
      setActiveTab(type);

      let dashboard: Dashboard;
      if (type === 'master') {
        const response = await api.get('/dashboard/master/');
        dashboard = response.data;
      } else {
        const response = await api.get('/dashboard/');
        const dashboards = response.data;
        dashboard = dashboards.find((d: Dashboard) => d.dashboard_type === type) || dashboards[0];
      }

      setCurrentDashboard(dashboard);
      if (dashboard) {
        await loadDashboardData(dashboard.id);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (dashboardId: string) => {
    try {
      const response = await api.get(`/dashboard/${dashboardId}/data/`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const refreshDashboard = async () => {
    if (!currentDashboard) return;
    
    try {
      setRefreshing(true);
      const response = await api.get(`/dashboard/${currentDashboard.id}/data/?refresh=true`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderWidget = (widget: Widget) => {
    const data = dashboardData[widget.id];
    
    if (!data && widget.widget_type !== 'list') {
      return <div className="text-gray-500">No data available</div>;
    }

    switch (widget.widget_type) {
      case 'metric_card':
        return renderMetricCard(widget, data);
      case 'chart_line':
      case 'chart_bar':
        return renderChart(widget, data);
      case 'progress_bar':
        return renderProgressBar(widget, data);
      case 'list':
        return renderList(widget, data);
      case 'correlation_chart':
        return renderCorrelationChart(widget, data);
      case 'comparison_view':
        return renderComparisonView(widget, data);
      default:
        return <div>Unknown widget type: {widget.widget_type}</div>;
    }
  };

  const renderMetricCard = (widget: Widget, data: any) => {
    const icon = getDataSourceIcon(widget.data_source);
    
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{widget.title}</p>
            <p className="text-2xl font-bold">
              {data?.value ?? '-'} <span className="text-sm font-normal text-gray-500">{data?.unit || ''}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = (widget: Widget, data: any) => {
    const chartData = data?.chart_data || [];
    
    return (
      <div className="space-y-4">
        <div className="h-48 flex items-end space-x-2">
          {chartData.slice(-7).map((item: any, index: number) => {
            const maxValue = Math.max(...chartData.map((d: any) => d.value));
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{ height: `${height}%` }}
                />
                <p className="text-xs text-gray-500 mt-1 rotate-45 origin-left truncate w-12">
                  {item.date?.split('-').slice(1).join('/')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProgressBar = (widget: Widget, data: any) => {
    const value = data?.value ?? 0;
    const total = data?.total ?? 100;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{widget.title}</span>
          <span className="font-medium">{percentage.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderList = (widget: Widget, data: any) => {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{widget.title}</p>
        <p className="text-gray-500">List view widget</p>
      </div>
    );
  };

  const renderCorrelationChart = (widget: Widget, data: any) => {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{widget.title}</p>
        <p className="text-gray-500">Correlation chart</p>
      </div>
    );
  };

  const renderComparisonView = (widget: Widget, data: any) => {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{widget.title}</p>
        <p className="text-gray-500">Comparison view</p>
      </div>
    );
  };

  const getDataSourceIcon = (dataSource: string) => {
    switch (dataSource) {
      case 'tasks':
        return <Target className="h-6 w-6" />;
      case 'habits':
        return <Activity className="h-6 w-6" />;
      case 'mood':
        return <Smile className="h-6 w-6" />;
      case 'health_sleep':
        return <Activity className="h-6 w-6" />;
      case 'health_exercise':
        return <Activity className="h-6 w-6" />;
      case 'health_water':
        return <Activity className="h-6 w-6" />;
      case 'finance':
        return <DollarSign className="h-6 w-6" />;
      case 'journal':
        return <BookOpen className="h-6 w-6" />;
      default:
        return <BarChart3 className="h-6 w-6" />;
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {currentDashboard?.description || 'Track your productivity and wellness'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshDashboard}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => navigate('/dashboard/custom')}>
              <Plus className="h-4 w-4 mr-2" />
              New Dashboard
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={loadDashboard}>
          <TabsList>
            <TabsTrigger value="master">
              <LayoutIcon className="h-4 w-4 mr-2" />
              Master
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Target className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="habits">
              <Activity className="h-4 w-4 mr-2" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="health">
              <Activity className="h-4 w-4 mr-2" />
              Health
            </TabsTrigger>
            <TabsTrigger value="finance">
              <DollarSign className="h-4 w-4 mr-2" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="productivity">
              <TrendingUp className="h-4 w-4 mr-2" />
              Productivity
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {currentDashboard && currentDashboard.widgets.length > 0 ? (
              <div className="grid grid-cols-12 gap-6">
                {currentDashboard.widgets
                  .filter(w => w.is_visible)
                  .map(widget => (
                    <Card
                      key={widget.id}
                      className="col-span-12 md:col-span-6 lg:col-span-3 xl:col-span-4"
                      style={{ gridColumn: `span ${widget.width}` }}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {widget.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderWidget(widget)}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No widgets configured</h3>
                  <p className="text-gray-600 mb-4">
                    Add widgets to visualize your data
                  </p>
                  <Button onClick={() => navigate('/dashboard/custom')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widgets
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

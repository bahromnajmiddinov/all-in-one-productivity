import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Skeleton, StatCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';
import { 
  RefreshCw, 
  Plus, 
  Layout as LayoutIcon, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Target, 
  BookOpen, 
  Smile,
  Zap,
} from 'lucide-react';

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

  const getDataSourceIcon = (dataSource: string) => {
    const iconClass = "w-5 h-5";
    switch (dataSource) {
      case 'tasks': return <Target className={iconClass} />;
      case 'habits': return <Activity className={iconClass} />;
      case 'mood': return <Smile className={iconClass} />;
      case 'health_sleep':
      case 'health_exercise':
      case 'health_water': return <Activity className={iconClass} />;
      case 'finance': return <DollarSign className={iconClass} />;
      case 'journal': return <BookOpen className={iconClass} />;
      default: return <BarChart3 className={iconClass} />;
    }
  };

  const getDataSourceColor = (dataSource: string) => {
    switch (dataSource) {
      case 'tasks': return 'text-accent bg-accent-subtle';
      case 'habits': return 'text-success bg-success-subtle';
      case 'mood': return 'text-warning bg-warning-subtle';
      case 'finance': return 'text-success bg-success-subtle';
      default: return 'text-fg-muted bg-bg-subtle';
    }
  };

  const renderWidget = (widget: Widget) => {
    const data = dashboardData[widget.id];
    
    if (!data && widget.widget_type !== 'list') {
      return (
        <div className="flex items-center justify-center h-24 text-fg-muted">
          <p className="text-sm">No data available</p>
        </div>
      );
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
        return (
          <div className="flex items-center justify-center h-24 text-fg-muted">
            <p className="text-sm">Unknown widget type: {widget.widget_type}</p>
          </div>
        );
    }
  };

  const renderMetricCard = (widget: Widget, data: any) => {
    const icon = getDataSourceIcon(widget.data_source);
    const colorClass = getDataSourceColor(widget.data_source);
    
    return (
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-[var(--radius)]", colorClass)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-caption">{widget.title}</p>
          <p className="text-metric-sm mt-0.5">
            {data?.value ?? '-'} 
            <span className="text-body-sm font-normal text-fg-muted ml-1">
              {data?.unit || ''}
            </span>
          </p>
        </div>
      </div>
    );
  };

  const renderChart = (widget: Widget, data: any) => {
    const chartData = data?.chart_data || [];
    
    return (
      <div className="space-y-4">
        <div className="h-40 flex items-end gap-1.5">
          {chartData.slice(-7).map((item: any, index: number) => {
            const maxValue = Math.max(...chartData.map((d: any) => d.value), 1);
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1.5">
                <div 
                  className="w-full bg-accent/80 rounded-t-[var(--radius-sm)] transition-all hover:bg-accent"
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <p className="text-caption text-fg-subtle truncate w-full text-center">
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
    const percentage = total > 0 ? Math.min(100, (value / total) * 100) : 0;
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-body-sm text-foreground">{widget.title}</span>
          <Badge variant={percentage >= 80 ? 'success' : percentage >= 50 ? 'default' : 'warning'}>
            {percentage.toFixed(0)}%
          </Badge>
        </div>
        <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-slow",
              percentage >= 80 ? 'bg-success' : percentage >= 50 ? 'bg-accent' : 'bg-warning'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-caption text-fg-subtle">
          {value} of {total}
        </p>
      </div>
    );
  };

  const renderList = (widget: Widget, data: any) => {
    return (
      <div className="space-y-2">
        <p className="text-body-sm text-foreground">{widget.title}</p>
        <p className="text-caption text-fg-muted">List view widget</p>
      </div>
    );
  };

  const renderCorrelationChart = (widget: Widget, data: any) => {
    return (
      <div className="space-y-2">
        <p className="text-body-sm text-foreground">{widget.title}</p>
        <p className="text-caption text-fg-muted">Correlation chart</p>
      </div>
    );
  };

  const renderComparisonView = (widget: Widget, data: any) => {
    return (
      <div className="space-y-2">
        <p className="text-body-sm text-foreground">{widget.title}</p>
        <p className="text-caption text-fg-muted">Comparison view</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <StatCardSkeleton count={4} />

        {/* Widgets Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h1">Dashboard</h1>
          <p className="text-body mt-1">
            {currentDashboard?.description || 'Track your productivity and wellness'}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            variant="secondary"
            size="icon"
            onClick={refreshDashboard}
            disabled={refreshing}
            className={refreshing ? 'animate-spin' : ''}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate('/dashboard/custom')}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Dashboard
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={loadDashboard}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="master" className="gap-2">
            <LayoutIcon className="w-4 h-4" />
            Master
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <Target className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="habits" className="gap-2">
            <Activity className="w-4 h-4" />
            Habits
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Zap className="w-4 h-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Finance
          </TabsTrigger>
          <TabsTrigger value="productivity" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Productivity
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {currentDashboard && currentDashboard.widgets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {currentDashboard.widgets
                .filter(w => w.is_visible)
                .map(widget => (
                  <Card 
                    key={widget.id}
                    isHoverable
                    className="overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-body font-medium">
                        {widget.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {renderWidget(widget)}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="w-12 h-12" strokeWidth={1} />}
              title="No widgets configured"
              description="Add widgets to visualize your data and track your progress"
              action={
                <Button onClick={() => navigate('/dashboard/custom')}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Widgets
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

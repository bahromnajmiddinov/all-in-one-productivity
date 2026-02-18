import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Layout as LayoutIcon, Target, Activity, DollarSign, BookOpen, Smile, BarChart3, TrendingUp } from 'lucide-react';

interface Widget {
  id?: string;
  widget_type: string;
  title: string;
  data_source: string;
  config: any;
  width: number;
  height: number;
  is_visible: boolean;
}

interface Dashboard {
  id?: string;
  name: string;
  dashboard_type: string;
  description: string;
  widgets: Widget[];
}

const WIDGET_TYPES = [
  { value: 'metric_card', label: 'Metric Card', icon: LayoutIcon },
  { value: 'chart_line', label: 'Line Chart', icon: TrendingUp },
  { value: 'chart_bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'progress_bar', label: 'Progress Bar', icon: Activity },
  { value: 'list', label: 'List', icon: Target },
  { value: 'correlation_chart', label: 'Correlation Chart', icon: TrendingUp },
  { value: 'comparison_view', label: 'Comparison View', icon: BarChart3 },
];

const DATA_SOURCES = [
  { value: 'tasks', label: 'Tasks', icon: Target },
  { value: 'habits', label: 'Habits', icon: Activity },
  { value: 'health_sleep', label: 'Sleep', icon: Activity },
  { value: 'health_exercise', label: 'Exercise', icon: Activity },
  { value: 'health_water', label: 'Water Intake', icon: Activity },
  { value: 'finance', label: 'Finance', icon: DollarSign },
  { value: 'journal', label: 'Journal', icon: BookOpen },
  { value: 'mood', label: 'Mood', icon: Smile },
];

export function CustomDashboard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [dashboard, setDashboard] = useState<Dashboard>({
    name: '',
    dashboard_type: 'custom',
    description: '',
    widgets: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [newWidget, setNewWidget] = useState<Widget>({
    widget_type: 'metric_card',
    title: '',
    data_source: 'tasks',
    config: {},
    width: 4,
    height: 3,
    is_visible: true,
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadDashboard(id);
    }
  }, [id]);

  const loadDashboard = async (dashboardId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/${dashboardId}/`);
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (dashboard.id) {
        // Update existing dashboard
        await api.patch(`/dashboard/${dashboard.id}/`, {
          name: dashboard.name,
          dashboard_type: dashboard.dashboard_type,
          description: dashboard.description,
          widgets: dashboard.widgets,
        });
      } else {
        // Create new dashboard
        const response = await api.post('/dashboard/', dashboard);
        navigate(`/dashboard/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    } finally {
      setSaving(false);
    }
  };

  const addWidget = () => {
    if (newWidget.title) {
      setDashboard({
        ...dashboard,
        widgets: [
          ...dashboard.widgets,
          {
            ...newWidget,
            id: `temp-${Date.now()}`,
          },
        ],
      });
      setNewWidget({
        widget_type: 'metric_card',
        title: '',
        data_source: 'tasks',
        config: {},
        width: 4,
        height: 3,
        is_visible: true,
      });
      setShowWidgetDialog(false);
    }
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      ),
    });
  };

  const removeWidget = (widgetId: string) => {
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter(w => w.id !== widgetId),
    });
  };

  const getDataSourceIcon = (dataSource: string) => {
    const source = DATA_SOURCES.find(s => s.value === dataSource);
    const Icon = source?.icon || BarChart3;
    return <Icon className="h-4 w-4" />;
  };

  const getWidgetTypeIcon = (widgetType: string) => {
    const type = WIDGET_TYPES.find(t => t.value === widgetType);
    const Icon = type?.icon || LayoutIcon;
    return <Icon className="h-4 w-4" />;
  };

  if (loading && id !== 'new') {
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
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <Input
                value={dashboard.name}
                onChange={e => setDashboard({ ...dashboard, name: e.target.value })}
                className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
                placeholder="Dashboard Name"
              />
              <Textarea
                value={dashboard.description}
                onChange={e => setDashboard({ ...dashboard, description: e.target.value })}
                className="mt-2 border-none px-0 focus-visible:ring-0 resize-none"
                placeholder="Add a description..."
                rows={1}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Dashboard'}
          </Button>
        </div>

        {/* Dashboard Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dashboard-type">Dashboard Type</Label>
                <Select
                  value={dashboard.dashboard_type}
                  onValueChange={value => setDashboard({ ...dashboard, dashboard_type: value })}
                >
                  <SelectTrigger id="dashboard-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="master">Master Overview</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="habits">Habits</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widgets Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Widgets</h2>
            <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Widget</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="widget-title">Widget Title</Label>
                    <Input
                      id="widget-title"
                      value={newWidget.title}
                      onChange={e => setNewWidget({ ...newWidget, title: e.target.value })}
                      placeholder="e.g., Tasks Completed Today"
                    />
                  </div>
                  <div>
                    <Label htmlFor="widget-type">Widget Type</Label>
                    <Select
                      value={newWidget.widget_type}
                      onValueChange={value => setNewWidget({ ...newWidget, widget_type: value })}
                    >
                      <SelectTrigger id="widget-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WIDGET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data-source">Data Source</Label>
                    <Select
                      value={newWidget.data_source}
                      onValueChange={value => setNewWidget({ ...newWidget, data_source: value })}
                    >
                      <SelectTrigger id="data-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_SOURCES.map(source => (
                          <SelectItem key={source.value} value={source.value}>
                            <div className="flex items-center">
                              {getDataSourceIcon(source.value)}
                              <span className="ml-2">{source.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="widget-width">Width (1-12)</Label>
                      <Input
                        id="widget-width"
                        type="number"
                        min={1}
                        max={12}
                        value={newWidget.width}
                        onChange={e => setNewWidget({ ...newWidget, width: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="widget-height">Height</Label>
                      <Input
                        id="widget-height"
                        type="number"
                        min={1}
                        value={newWidget.height}
                        onChange={e => setNewWidget({ ...newWidget, height: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowWidgetDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addWidget} disabled={!newWidget.title}>
                      Add Widget
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Widgets List */}
          {dashboard.widgets.length > 0 ? (
            <div className="space-y-3">
              {dashboard.widgets.map((widget, index) => (
                <Card key={widget.id} className="group">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                        <div className="p-2 rounded bg-primary/10">
                          {getWidgetTypeIcon(widget.widget_type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{widget.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Badge variant="secondary">{widget.widget_type}</Badge>
                            <div className="flex items-center">
                              {getDataSourceIcon(widget.data_source)}
                              <span className="ml-1">
                                {DATA_SOURCES.find(s => s.value === widget.data_source)?.label}
                              </span>
                            </div>
                            <span>•</span>
                            <span>{widget.width} × {widget.height}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWidget(widget.id!)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <LayoutIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
                <p className="text-gray-600">
                  Add widgets to visualize your data
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

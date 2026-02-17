from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet,
    DashboardWidgetViewSet,
    DashboardPreferenceViewSet,
    DashboardInsightViewSet,
    MetricComparisonViewSet,
    CorrelationAnalysisViewSet,
)

router = DefaultRouter()
router.register(r'dashboards', DashboardViewSet, basename='dashboard')
router.register(r'widgets', DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'preferences', DashboardPreferenceViewSet, basename='dashboard-preference')
router.register(r'insights', DashboardInsightViewSet, basename='dashboard-insight')
router.register(r'comparisons', MetricComparisonViewSet, basename='metric-comparison')
router.register(r'correlations', CorrelationAnalysisViewSet, basename='correlation-analysis')

urlpatterns = [
    path('api/v1/dashboard/', include(router.urls)),
]

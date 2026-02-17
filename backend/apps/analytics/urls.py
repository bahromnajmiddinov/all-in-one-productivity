from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CrossModuleCorrelationViewSet,
    AutomatedReportViewSet,
    TrendDetectionViewSet,
    AnomalyDetectionViewSet,
    GoalProgressViewSet,
    PredictiveForecastViewSet,
    PeriodComparisonViewSet,
    CustomReportViewSet,
    AchievementBadgeViewSet,
    UserAchievementViewSet,
    AnalyticsExportViewSet,
    AnalyticsInsightViewSet,
    AnalyticsDashboardViewSet,
)

router = DefaultRouter()
router.register(r'correlations', CrossModuleCorrelationViewSet, basename='cross-module-correlation')
router.register(r'reports/automated', AutomatedReportViewSet, basename='automated-report')
router.register(r'trends', TrendDetectionViewSet, basename='trend-detection')
router.register(r'anomalies', AnomalyDetectionViewSet, basename='anomaly-detection')
router.register(r'goals', GoalProgressViewSet, basename='goal-progress')
router.register(r'forecasts', PredictiveForecastViewSet, basename='predictive-forecast')
router.register(r'comparisons', PeriodComparisonViewSet, basename='period-comparison')
router.register(r'reports/custom', CustomReportViewSet, basename='custom-report')
router.register(r'badges', AchievementBadgeViewSet, basename='achievement-badge')
router.register(r'achievements', UserAchievementViewSet, basename='user-achievement')
router.register(r'exports', AnalyticsExportViewSet, basename='analytics-export')
router.register(r'insights', AnalyticsInsightViewSet, basename='analytics-insight')
router.register(r'dashboard', AnalyticsDashboardViewSet, basename='analytics-dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

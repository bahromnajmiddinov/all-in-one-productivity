from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.pomodoro.views import PomodoroSettingsViewSet
from apps.tasks.views import ProjectViewSet, TaskViewSet, TagViewSet
from apps.calendar.views import CalendarEventViewSet, CalendarPreferenceViewSet, CalendarViewSet
from apps.dashboard.views import (
    DashboardViewSet,
    DashboardWidgetViewSet,
    DashboardPreferenceViewSet,
    DashboardInsightViewSet,
    MetricComparisonViewSet,
    CorrelationAnalysisViewSet,
)
from apps.health.views import (
    WaterIntakeSettingsViewSet,
    WaterLogViewSet,
    WaterContainerViewSet,
    SleepLogViewSet,
    SleepDisruptionViewSet,
    SleepNapViewSet,
    SleepGoalViewSet,
    SleepStatsViewSet,
    SleepDebtViewSet,
    SleepInsightViewSet,
    ExerciseTypeViewSet,
    ExerciseLogViewSet,
    BodyMetricsViewSet,
    MuscleGroupViewSet,
    EquipmentViewSet,
    ExerciseViewSet,
    WorkoutViewSet,
    WorkoutExerciseViewSet,
    ExerciseSetViewSet,
    WorkoutLogViewSet,
    WorkoutPlanViewSet,
    WorkoutPlanWeekViewSet,
    WorkoutPlanDayViewSet,
    PersonalRecordViewSet,
    FitnessGoalViewSet,
    RestDayViewSet,
    ExerciseStatsViewSet,
    ProgressiveOverloadViewSet,
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'dashboard/widgets', DashboardWidgetViewSet, basename='dashboard-widget')
router.register(r'dashboard/preferences', DashboardPreferenceViewSet, basename='dashboard-preference')
router.register(r'dashboard/insights', DashboardInsightViewSet, basename='dashboard-insight')
router.register(r'dashboard/comparisons', MetricComparisonViewSet, basename='metric-comparison')
router.register(r'dashboard/correlations', CorrelationAnalysisViewSet, basename='correlation-analysis')
router.register(r'calendar', CalendarViewSet, basename='calendar')
router.register(r'calendar/events', CalendarEventViewSet, basename='calendar-event')
router.register(r'calendar/preferences', CalendarPreferenceViewSet, basename='calendar-preference')
router.register(r'health/water/settings', WaterIntakeSettingsViewSet, basename='water-settings')
router.register(r'health/water/containers', WaterContainerViewSet, basename='water-container')
router.register(r'health/water/logs', WaterLogViewSet, basename='water-log')
router.register(r'health/sleep/logs', SleepLogViewSet, basename='sleep-log')
router.register(r'health/sleep/disruptions', SleepDisruptionViewSet, basename='sleep-disruption')
router.register(r'health/sleep/naps', SleepNapViewSet, basename='sleep-nap')
router.register(r'health/sleep/goals', SleepGoalViewSet, basename='sleep-goal')
router.register(r'health/sleep/stats', SleepStatsViewSet, basename='sleep-stats')
router.register(r'health/sleep/debt', SleepDebtViewSet, basename='sleep-debt')
router.register(r'health/sleep/insights', SleepInsightViewSet, basename='sleep-insight')
router.register(r'health/exercise/types', ExerciseTypeViewSet, basename='exercise-type')
router.register(r'health/exercise/logs', ExerciseLogViewSet, basename='exercise-log')
router.register(r'health/body-metrics', BodyMetricsViewSet, basename='body-metrics')
router.register(r'health/exercises', ExerciseViewSet, basename='exercise')
router.register(r'health/muscle-groups', MuscleGroupViewSet, basename='muscle-group')
router.register(r'health/equipment', EquipmentViewSet, basename='equipment')
router.register(r'health/workouts', WorkoutViewSet, basename='workout')
router.register(r'health/workout-exercises', WorkoutExerciseViewSet, basename='workout-exercise')
router.register(r'health/exercise-sets', ExerciseSetViewSet, basename='exercise-set')
router.register(r'health/workout-logs', WorkoutLogViewSet, basename='workout-log')
router.register(r'health/workout-plans', WorkoutPlanViewSet, basename='workout-plan')
router.register(r'health/workout-plan-weeks', WorkoutPlanWeekViewSet, basename='workout-plan-week')
router.register(r'health/workout-plan-days', WorkoutPlanDayViewSet, basename='workout-plan-day')
router.register(r'health/personal-records', PersonalRecordViewSet, basename='personal-record')
router.register(r'health/fitness-goals', FitnessGoalViewSet, basename='fitness-goal')
router.register(r'health/rest-days', RestDayViewSet, basename='rest-day')
router.register(r'health/exercise-stats', ExerciseStatsViewSet, basename='exercise-stats')
router.register(r'health/progressive-overload', ProgressiveOverloadViewSet, basename='progressive-overload')

urlpatterns = [
    path('admin/', admin.site.urls),
    path(
        'api/v1/pomodoro/settings/',
        PomodoroSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}),
    ),
    path(
        'api/v1/health/water/settings/',
        WaterIntakeSettingsViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}),
    ),
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/', include('apps.core.urls')),
    path('api/v1/notes/', include('apps.notes.urls')),
    path('api/v1/', include('apps.habits.urls')),
    path('api/v1/pomodoro/', include('apps.pomodoro.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/journal/', include('apps.journal.urls')),
    path('api/v1/mood/', include('apps.mood.urls')),
    path('api/v1/', include('apps.dashboard.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]

from django.contrib import admin
from .models import Calendar, CalendarEvent, CalendarViewPreference

@admin.register(Calendar)
class CalendarAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'calendar_type', 'color', 'is_visible', 'is_default', 'order']
    list_filter = ['calendar_type', 'is_visible', 'is_default', 'created_at']
    search_fields = ['name', 'user__email']
    list_editable = ['is_visible', 'is_default', 'order']

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'event_type', 'start_date', 'start_time', 'end_date', 'end_time', 'calendar', 'status', 'has_conflict']
    list_filter = ['event_type', 'status', 'is_all_day', 'is_recurring', 'has_conflict', 'start_date']
    search_fields = ['title', 'description', 'location', 'user__email']
    list_editable = ['status', 'has_conflict']
    date_hierarchy = 'start_date'

@admin.register(CalendarViewPreference)
class CalendarViewPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'default_view', 'first_day_of_week', 'hour_start', 'hour_end']
    list_filter = ['default_view', 'first_day_of_week']
    search_fields = ['user__email']

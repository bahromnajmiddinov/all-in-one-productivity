from django.contrib import admin
from .models import Habit, HabitCompletion


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'frequency', 'is_active', 'created_at']
    list_filter = ['frequency', 'is_active', 'created_at']
    search_fields = ['name', 'description']


@admin.register(HabitCompletion)
class HabitCompletionAdmin(admin.ModelAdmin):
    list_display = ['habit', 'date', 'completed_at', 'user']
    list_filter = ['date', 'completed_at']
    search_fields = ['habit__name', 'notes']

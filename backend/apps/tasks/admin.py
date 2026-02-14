from django.contrib import admin
from .models import Project, Task, Tag, TaskTag, TaskDependency

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_archived', 'created_at')
    list_filter = ('is_archived', 'user')
    search_fields = ('name',)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'color')
    list_filter = ('user',)
    search_fields = ('name',)

class TaskTagInline(admin.TabularInline):
    model = TaskTag
    extra = 1

class TaskDependencyInline(admin.TabularInline):
    model = TaskDependency
    fk_name = 'task'
    extra = 0


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'project', 'status', 'priority', 'due_date', 'estimated_minutes', 'recurrence_rule')
    list_filter = ('status', 'priority', 'user', 'project')
    search_fields = ('title', 'description')
    inlines = [TaskTagInline, TaskDependencyInline]

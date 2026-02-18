# Integration & Automation Features

This document outlines the integration and automation layer that connects modules, triggers routines, and enables bulk operations.

## Backend Features

### Models

1. **TaskHabitLink**
   - Links tasks to habits for automatic completion
   - Supports completion source based on task completion or due date

2. **TaskTimeLog** (Tasks app)
   - Captures time logs from Pomodoro sessions or manual entries
   - Stores duration, source, and timestamps

3. **SmartNotification**
   - Context-aware reminders with optional location payloads
   - Tracks scheduled and sent timestamps

4. **AutomationRule**
   - If-then rules with JSON conditions and action payloads
   - Supports triggers for sleep, habits, mood, calendar, and more

5. **ExternalIntegration**
   - Stores connection metadata for fitness, banking, and calendar services
   - Tracks sync status and last sync time

6. **VoiceCommand**
   - Logs voice transcripts and parsed intents
   - Tracks processing status

7. **BatchOperation**
   - Bulk update, archive, or delete across supported modules
   - Stores operation result summaries

### API Endpoints

- `/api/v1/automation/task-habit-links/` - Manage task-habit links
- `/api/v1/automation/smart-notifications/` - Create and send smart reminders
- `/api/v1/automation/automation-rules/` - CRUD for automation rules
- `/api/v1/automation/integrations/` - External integration management
- `/api/v1/automation/voice-commands/` - Voice input logs
- `/api/v1/automation/batch-operations/` - Execute bulk actions
- `/api/v1/tasks/time-logs/` - Task time logs

## Frontend Features

- **Automation Hub page** with sections for cross-linking, notifications, rules, integrations, voice input, and batch operations.
- **Navigation entry** for quick access to the Integration & Automation dashboard.

## Cross-Linking Highlights

- Completing a task can auto-complete linked habits.
- Completed Pomodoro work sessions create task time logs automatically.

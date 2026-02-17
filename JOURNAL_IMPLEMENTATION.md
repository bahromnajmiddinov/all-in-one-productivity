# Journal System Implementation

## Overview

A comprehensive journaling system has been implemented with all requested features, including daily journaling, prompts, templates, mood tracking, streaks, analytics, and more.

## Features Implemented

### 1. Daily Journaling
- **Dated entries** with unique constraint per user per day
- **Rich text support** with markdown rendering
- **Content editing** with automatic word count tracking
- **Entry metadata** (created/updated timestamps, private flag)

### 2. Journal Prompts
- **Daily reflection questions** (e.g., "What are three things you learned today?")
- **Gratitude prompts** (e.g., "What are three things you're grateful for?")
- **Goal review prompts** (e.g., "What progress did you make on your goals today?")
- **Creative writing prompts** (e.g., "If today had a theme song, what would it be?")
- **Mindfulness prompts** (e.g., "What moments of peace did you experience today?")
- **Random prompt generator** for variety
- **Daily prompt** that changes based on date

### 3. Entry Templates
- **Morning Pages** - Start your day with reflection and intention setting
- **Evening Reflection** - Review your day and prepare for tomorrow
- **Weekly Review** - Comprehensive weekly assessment
- **Monthly Review** - Extended reflection on monthly progress
- **Gratitude Journal** - Focus on appreciation
- **Goal Setting** - Define and track objectives
- **Custom templates** - Users can create their own

### 4. Mood Integration
- **Mood rating** (1-5 scale: Terrible to Amazing)
- **Energy level tracking** (1-10)
- **Stress level tracking** (1-10)
- **Sleep quality tracking** (1-10)
- **Mood notes** for additional context
- **Mood trends visualization**
- **Mood distribution analysis**

### 5. Tagging & Categorization
- **Tag management** with custom names and colors
- **Multi-tag support** for entries
- **Popular tags** tracking
- **Tag-based filtering** and searching
- **Color-coded tags** for visual organization

### 6. Entry Streaks
- **Current streak** tracking consecutive journaling days
- **Best streak** record with dates
- **Streak percentage** for the current month
- **Calendar heatmap** visualization
- **Automatic streak updates** on entry creation

### 7. Reflection Dashboard
- **Consistency score** (0-100)
- **Total entries** and word count
- **Mood trends** (improving/declining/stable)
- **Writing velocity** (increasing/decreasing/stable)
- **Most productive day** analysis
- **Average entries per week**
- **Monthly and yearly statistics**

### 8. Search & Timeline
- **Full-text search** across title and content
- **Advanced filtering** by:
  - Date range
  - Tags
  - Mood range
  - Sentiment
  - Word count
  - Template
  - Favorites
- **Timeline view** grouped by date
- **Calendar view** for easy date browsing
- **By date lookup** for specific days

### 9. Word Count Tracking
- **Automatic word count** calculation on save
- **Total word count** across all entries
- **Average word count** per entry
- **Word count trends** over time
- **Reading time** estimation (200 words/minute)

### 10. Sentiment Analysis
- **Automatic sentiment scoring** (-1 to 1)
- **Sentiment labels** (positive/negative/neutral)
- **Sentiment distribution** overview
- **Keyword extraction** from entries
- **Sentiment over time** visualization

### 11. Memory Lane
- **Random past entry** reminders
- **Configurable time range** (e.g., 365 days ago)
- **Adjustable count** (e.g., 5 entries)
- **Monthly reminders** for past entries
- **Highlight excerpts** for reflection
- **Reflection questions** for deeper analysis

## Backend Architecture

### Models

1. **JournalTag** - Tag management
2. **JournalMood** - Mood tracking with multiple metrics
3. **JournalPrompt** - Question/prompts for journaling
4. **JournalTemplate** - Reusable entry templates
5. **JournalEntry** - Main journal entries
6. **JournalStreak** - Streak tracking
7. **EntryAnalytics** - Per-entry analytics
8. **JournalReminder** - Memory lane reminders
9. **JournalStats** - Aggregated statistics

### API Endpoints

```
/api/v1/journal/
├── tags/                    # Tag management
├── moods/                   # Mood tracking
│   ├── recent/             # Recent mood entries
│   ├── trends/             # Mood trends over time
│   └── distribution/       # Mood distribution
├── prompts/                # Journal prompts
│   ├── random/             # Get random prompt
│   ├── daily/              # Get daily prompt
│   └── by_type/            # Prompts grouped by type
├── templates/              # Journal templates
│   └── system/             # Get system templates
├── entries/                # Journal entries
│   ├── timeline/           # Timeline view
│   ├── calendar/           # Calendar view
│   ├── by_date/            # Get by specific date
│   ├── search/             # Advanced search
│   ├── favorites/          # Favorite entries
│   ├── memory_lane/        # Random past entries
│   ├── word_count_trends/  # Word count over time
│   └── sentiment_overview/ # Sentiment analysis
├── analytics/              # Entry analytics
├── streaks/                # Streak tracking
│   ├── mine/               # Current user's streak
│   └── calendar_heatmap/   # Heatmap data
├── reminders/              # Memory lane reminders
│   ├── upcoming/           # Upcoming reminders
│   ├── due/                # Due reminders
│   └── process_due/        # Process all due reminders
└── stats/                  # Statistics
    ├── dashboard/          # Dashboard stats
    ├── consistency/        # Consistency metrics
    ├── mood_over_time/     # Mood over time
    └── writing_patterns/   # Writing pattern analysis
```

## Frontend Architecture

### Pages

1. **Journal** (`/journal`) - Main journal listing with stats
2. **Journal Entry Detail** (`/journal/:id`) - View/edit entry
3. **New Entry** (`/journal/new`) - Create new entry with templates/prompts
4. **Journal Analytics** (`/journal/analytics`) - Reflection dashboard

### Components

- Entry cards with mood, sentiment, and word count
- Streak display with calendar
- Mood check-in interface with emoji selector
- Template and prompt selection
- Tag management interface
- Search and filter controls
- Analytics cards and charts

## Database Schema

### JournalEntry
```python
- id (UUID, primary key)
- user (FK to User)
- title (CharField, optional)
- content (TextField)
- rendered_content (TextField, markdown rendered)
- entry_date (DateField, unique per user)
- created_at (DateTimeField)
- updated_at (DateTimeField)
- tags (ManyToMany to JournalTag)
- template (FK to JournalTemplate, optional)
- prompt (FK to JournalPrompt, optional)
- mood (FK to JournalMood, optional)
- is_favorite (BooleanField)
- is_private (BooleanField)
- word_count (PositiveIntegerField)
```

### JournalMood
```python
- id (UUID, primary key)
- user (FK to User)
- mood (PositiveSmallIntegerField, 1-5)
- energy_level (PositiveSmallIntegerField, 1-10, optional)
- stress_level (PositiveSmallIntegerField, 1-10, optional)
- sleep_quality (PositiveSmallIntegerField, 1-10, optional)
- notes (TextField, optional)
- date (DateField)
- created_at (DateTimeField)
```

### JournalStreak
```python
- id (UUID, primary key)
- user (OneToOne to User)
- current_streak (PositiveIntegerField)
- last_entry_date (DateField)
- best_streak (PositiveIntegerField)
- best_streak_start (DateField)
- best_streak_end (DateField)
- total_entries (PositiveIntegerField)
- total_word_count (PositiveIntegerField)
- longest_streak_this_month (PositiveIntegerField)
- longest_streak_this_year (PositiveIntegerField)
- updated_at (DateTimeField)
```

## Initialization

To initialize the journal system with default prompts and templates:

```bash
cd backend
python manage.py init_journal_data
```

This will create:
- 10 system prompts (reflection, gratitude, goal, creativity, mindfulness)
- 6 system templates (morning, evening, weekly, gratitude, goal)

## Usage Examples

### Creating a Journal Entry

```python
# Backend
from apps.journal.models import JournalEntry, JournalMood

# Create mood
mood = JournalMood.objects.create(
    user=request.user,
    mood=4,
    energy_level=7,
    stress_level=3,
    date=date.today()
)

# Create entry
entry = JournalEntry.objects.create(
    user=request.user,
    title="My Day",
    content="Today was great...",
    entry_date=date.today(),
    mood=mood
)
```

```javascript
// Frontend
const entry = await journalApi.createEntry({
  title: "My Day",
  content: "Today was great...",
  entry_date: "2024-01-15",
  mood: moodId
});
```

### Getting Streak Information

```python
# Backend
streak = JournalStreak.objects.get(user=request.user)
print(f"Current streak: {streak.current_streak} days")
```

```javascript
// Frontend
const streak = await journalApi.getMyStreak();
console.log(`Current streak: ${streak.current_streak} days`);
```

### Searching Entries

```javascript
// Frontend - Advanced search
const results = await journalApi.searchEntries({
  q: "gratitude",
  tags: ["tag1", "tag2"],
  start_date: "2024-01-01",
  end_date: "2024-01-31",
  min_sentiment: "0.3",
  min_words: "100"
});
```

## Key Features Highlights

### Automatic Analytics
- Word count calculated on every save
- Sentiment analysis using keyword matching
- Reading time estimation
- View and edit tracking

### Streak System
- Automatic streak calculation on entry creation
- Handles consecutive days correctly
- Tracks best streak with date range
- Monthly and yearly streak milestones

### Memory Lane
- Automatic reminder creation for each entry
- Monthly reminders by default
- Configurable to different intervals
- Dismiss and reschedule functionality

### Search Capabilities
- Full-text search across title and content
- Multi-filter combinations
- Sentiment-based filtering
- Date range filtering
- Tag-based filtering

## File Structure

```
backend/
└── apps/
    └── journal/
        ├── __init__.py
        ├── admin.py
        ├── apps.py
        ├── management/
        │   └── commands/
        │       └── init_journal_data.py
        ├── migrations/
        │   └── __init__.py
        ├── models.py
        ├── serializers.py
        ├── tests.py
        ├── urls.py
        └── views.py

frontend/
└── src/
    ├── api.ts (updated)
    ├── types.ts (updated)
    ├── App.tsx (updated)
    ├── pages/
    │   ├── Journal.tsx
    │   ├── JournalEntryDetail.tsx
    │   ├── JournalNewEntry.tsx
    │   └── JournalAnalytics.tsx
    └── components/
        └── Layout.tsx (updated)
```

## Testing

Basic tests have been created for:
- JournalTag model
- JournalMood model
- JournalEntry model (including word count and sentiment)
- JournalStreak model (including streak updates)
- EntryAnalytics model

Run tests with:
```bash
cd backend
pytest apps/journal/tests.py
```

## Future Enhancements

Potential improvements for future development:
1. Rich text editor with markdown support
2. Image/media attachments to entries
3. Voice-to-text for journal entries
4. Export entries to PDF/markdown
5. Collaborative journaling (shared entries)
6. Advanced sentiment analysis with ML
7. Entry templates gallery
8. Custom prompt categories
9. Journal insights and recommendations
10. Integration with calendar events
11. Goal tracking integration
12. Habit correlation with journal entries

## Notes

- All journal entries are private by default to user
- Streaks reset after missing a day (not consecutive)
- Sentiment analysis is keyword-based (can be improved with ML)
- Memory lane reminders are created automatically for each entry
- System prompts and templates are available to all users
- Users can create custom prompts and templates
- Tags are user-specific and color-coded

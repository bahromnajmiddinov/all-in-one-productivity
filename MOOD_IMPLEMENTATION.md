# Mood Tracking System Implementation

## Overview

A comprehensive mood tracking system has been implemented with all requested features, including multiple daily check-ins, emotion wheels, mood factors, pattern analysis, correlations, AI insights, and journal integration.

## Features Implemented

### 1. Mood Scale System ✅
- **Numeric Scale (1-10)**: Standard numerical rating
- **Emoji-based Scale**: Visual emoji representations
- **Descriptive Scale**: Word-based ratings (Depressed to Euphoric)
- **Custom Scales**: Users can create their own scales
- **Default Scale Management**: One default scale per user

### 2. Multiple Daily Check-ins ✅
- **Time of Day Support**: Morning, Afternoon, Evening, Night, Anytime
- **Multiple Entries Per Day**: Track mood changes throughout the day
- **Quick Log**: Fast mood logging with minimal friction
- **Entry Timestamps**: Precise date and time tracking

### 3. Mood Factors ✅
Track contributing factors with impact ratings:
- Sleep quality and duration
- Exercise activity
- Social interactions
- Work stress levels
- Diet and nutrition
- Weather conditions
- Physical health
- Productivity levels
- Relationships
- Finances
- Hobbies and leisure
- Environment

Each factor includes:
- Impact rating (-5 to +5)
- Optional quality rating (1-10)
- Category-based organization
- Notes for context

### 4. Emotion Wheels ✅
- **Primary Emotions**: Joy, Trust, Fear, Surprise, Sadness, Disgust, Anger, Anticipation
- **Secondary Emotions**: Love, Optimism, Submission, Awe, Disapproval, Remorse, Contempt, Aggressiveness
- **Specific Emotions**: Granular emotion selection
- **Intensity Levels**: Mild, Moderate, Strong, Intense
- **Dominant Emotion Flag**: Mark primary emotion for entry

### 5. Mood Timeline ✅
- **Line Graph Visualization**: Daily mood fluctuations
- **7-Day Rolling Average**: Smoothed trend line
- **30-Day Rolling Average**: Long-term trend analysis
- **Interactive Tooltips**: Detailed entry information
- **Date Range Selection**: 7, 30, 90, 365 day views

### 6. Mood Patterns ✅
- **Weekly Patterns**: Day-of-week mood analysis
- **Time-of-Day Patterns**: Best/worst times of day
- **Monthly Trends**: Long-term improvement/decline tracking
- **Seasonal Variations**: Year-over-year comparisons
- **Pattern Insights**: Automatic pattern detection and descriptions

### 7. Trigger Analysis ✅
- **Trigger Types**: Events, People, Thoughts, Physical sensations, External/Internal circumstances
- **Positive/Negative Classification**: Track helpful and harmful triggers
- **Related Activities**: Link to habits and tasks
- **Common Trigger Analysis**: Most frequent triggers identification

### 8. Mood vs. X Charts ✅
Compare mood against:
- Sleep duration and quality
- Exercise activity
- Habit completion rates
- Productivity metrics
- Social activity
- Work-related metrics

Features:
- Correlation coefficient calculation
- Side-by-side visualization
- Time-based filtering
- Cross-domain analysis

### 9. Mood Heatmap ✅
- **Calendar View**: Visual mood representation
- **Color Coding**: Green (high) to Red (low)
- **Year View**: Full year overview
- **Entry Count**: Multiple entries per day support
- **Quick Glance**: Easy pattern recognition

### 10. Average Mood Trends ✅
- **7-Day Average**: Short-term trend
- **30-Day Average**: Medium-term trend
- **90-Day Average**: Long-term trend
- **Automatic Calculation**: Real-time updates
- **Trend Comparison**: Period-over-period analysis

### 11. Mood Prediction & AI Insights ✅
- **Pattern Detection**: Automatic pattern recognition
- **Trend Warnings**: Declining mood alerts
- **Achievement Recognition**: Positive streaks and improvements
- **Actionable Suggestions**: Personalized recommendations
- **Confidence Scoring**: Reliability indicators
- **Dismissible Insights**: User-controlled notifications

### 12. Mood Journal Integration ✅
- **Bi-directional Links**: Connect mood entries to journal entries
- **Theme Extraction**: Automatic key theme identification
- **Sentiment Analysis**: Cross-reference with journal sentiment
- **Contextual Understanding**: Rich emotional context

## Backend Architecture

### Models

1. **MoodScale** - Customizable mood rating scales
2. **MoodEntry** - Main mood check-in entries
3. **MoodFactor** - Contributing factors with impact ratings
4. **Emotion** - Detailed emotion wheel selections
5. **MoodTrigger** - Trigger tracking and analysis
6. **MoodCorrelation** - Computed correlations with activities
7. **MoodInsight** - AI-generated insights and suggestions
8. **MoodStats** - Aggregated statistics and trends
9. **MoodJournalLink** - Journal integration links

### API Endpoints

```
/api/v1/mood/
├── scales/                    # Mood scale management
│   └── set_default/          # Set default scale
├── entries/                  # Mood entry CRUD
│   ├── quick_log/           # Quick mood logging
│   ├── today/               # Today's entries
│   ├── timeline/            # Timeline data with rolling averages
│   ├── heatmap/             # Calendar heatmap data
│   ├── patterns/            # Pattern analysis
│   ├── compare/             # Mood vs X comparisons
│   └── emotion_distribution/# Emotion distribution
├── factors/                  # Mood factor management
├── emotions/                 # Emotion management
│   └── wheel/               # Emotion wheel structure
├── triggers/                 # Trigger management
│   └── analysis/            # Trigger analysis
├── correlations/             # Correlation data
│   └── compute/             # Compute correlations
├── insights/                 # AI insights
│   ├── dismiss/             # Dismiss insight
│   ├── mark_read/           # Mark as read
│   └── generate/            # Generate new insights
├── stats/                    # Statistics
│   └── refresh/             # Refresh statistics
└── journal-links/            # Journal integration
```

### Analytics Features

- **Timeline Analysis**: Rolling averages, trend detection
- **Pattern Recognition**: Day-of-week, time-of-day, seasonal
- **Correlation Engine**: Statistical correlation with other metrics
- **Insight Generation**: Rule-based AI insights
- **Heatmap Generation**: Calendar visualization data

## Frontend Architecture

### Pages

1. **Mood Dashboard** (`/mood`) - Main mood tracking interface

### Components

- **Stats Overview**: Key metrics display
- **Mood Timeline Chart**: Interactive line chart
- **Calendar Heatmap**: Visual mood history
- **Pattern Cards**: Pattern analysis display
- **Emotion Wheel**: Emotion selection interface
- **Quick Log Modal**: Fast mood entry
- **Insights Panel**: AI-generated insights

### Features

- **Tabbed Interface**: Overview, Timeline, Patterns, Emotions, Insights
- **Time Period Selection**: 7, 30, 90, 365 day views
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data refresh
- **Visual Analytics**: Charts and graphs

## Database Schema

### MoodEntry
```python
- id (UUID, primary key)
- user (FK to User)
- scale (FK to MoodScale, optional)
- mood_value (Integer 1-10)
- time_of_day (Choice: morning/afternoon/evening/night/anytime)
- entry_date (DateField)
- entry_time (TimeField)
- notes (TextField, optional)
- weather (CharField, optional)
- location (CharField, optional)
```

### MoodFactor
```python
- id (UUID, primary key)
- mood_entry (FK to MoodEntry)
- category (Choice: sleep/exercise/social/work/etc.)
- name (CharField, optional)
- impact (Integer -5 to +5)
- rating (Integer 1-10, optional)
- notes (TextField, optional)
```

### Emotion
```python
- id (UUID, primary key)
- mood_entry (FK to MoodEntry)
- primary_emotion (Choice from emotion wheel)
- specific_emotion (CharField, optional)
- intensity (Choice: 1-4)
- is_dominant (Boolean)
```

## Initialization

To initialize the mood system with default scales:

```bash
cd backend
python manage.py init_mood_data
```

This will create:
- 1-10 Numeric Scale
- Emoji Scale (5-point)
- Descriptive Scale (7-point)

## Usage Examples

### Creating a Mood Entry

```python
# Backend
from apps.mood.models import MoodEntry, MoodFactor

entry = MoodEntry.objects.create(
    user=request.user,
    mood_value=7,
    time_of_day='morning',
    entry_date=date.today()
)

# Add factors
MoodFactor.objects.create(
    mood_entry=entry,
    category='sleep',
    impact=3,
    rating=8
)
```

```javascript
// Frontend
const entry = await moodApi.quickLog({
  mood_value: 7,
  time_of_day: 'morning',
  notes: 'Feeling energized after good sleep!'
});
```

### Getting Timeline Data

```javascript
const timeline = await moodApi.getTimeline(30);
// Returns mood data with rolling averages
```

### Generating Insights

```javascript
const insights = await moodApi.generateInsights(30);
// Returns AI-generated insights based on recent data
```

## Integration Points

- **Health App**: Sleep logs, exercise logs correlation
- **Habits App**: Habit completion correlation
- **Journal App**: Bi-directional mood-journal linking
- **Tasks App**: Task completion impact analysis

## Future Enhancements

Potential improvements:
1. Machine learning-based mood prediction
2. Weather API integration for automatic weather tracking
3. Voice-based mood logging
4. Photo-based mood capture
5. Social sharing (optional)
6. Medication tracking correlation
7. Therapy session notes integration
8. Gratitude practice integration
9. Mindfulness session tracking
10. Biometric data integration (heart rate, etc.)

## Testing

Run tests with:
```bash
cd backend
pytest apps/mood/tests.py
```

Tests cover:
- MoodScale model
- MoodEntry model with scale labels
- MoodFactor impact calculation
- Emotion wheel functionality
- MoodStats aggregation
- MoodInsight generation

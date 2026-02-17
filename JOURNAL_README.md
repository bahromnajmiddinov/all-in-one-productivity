# Journal System - Quick Start Guide

## Overview

The Journal System is a comprehensive personal journaling application integrated into your productivity platform. It helps you track your thoughts, mood, and personal growth over time.

## Getting Started

### 1. Initialize the System

First, run the initialization command to create default prompts and templates:

```bash
cd backend
python manage.py init_journal_data
```

This creates:
- 10 writing prompts (reflection, gratitude, goal, creativity, mindfulness)
- 6 entry templates (morning, evening, weekly, gratitude, goal)

### 2. Create Your First Entry

1. Navigate to `/journal` in the application
2. Click "New Entry"
3. Choose a template (optional) or start writing freely
4. Check in with your mood (optional but recommended)
5. Add tags to organize your entry
6. Click "Save Entry"

### 3. Explore Features

#### Daily Journaling
- Write dated entries with rich text
- Track your mood and energy levels
- Add tags for organization
- Mark favorite entries

#### Templates
Use templates for structured journaling:
- **Morning Pages** - Start your day intentionally
- **Evening Reflection** - Review and reflect
- **Weekly Review** - Comprehensive review
- **Gratitude Journal** - Practice gratitude
- **Goal Setting** - Plan your objectives

#### Prompts
Get inspiration from daily prompts:
- Click "Get New Prompt" in the new entry page
- Use the daily prompt (changes daily)
- Browse prompts by type

#### Mood Tracking
Track how you're feeling:
- Rate mood (1-5)
- Energy level (1-10)
- Stress level (1-10)
- Sleep quality (1-10)
- View mood trends over time

#### Streaks
Build consistency:
- Track consecutive journaling days
- View your best streak
- See streak percentage for the month
- Check calendar heatmap

#### Analytics
Monitor your progress:
- View dashboard stats
- Check consistency score
- Analyze mood trends
- See writing patterns
- Review most used tags

#### Search
Find entries easily:
- Full-text search
- Filter by date range
- Filter by mood
- Filter by tags
- Filter by sentiment
- Filter by word count

#### Memory Lane
Reflect on past entries:
- Get random past entry reminders
- See highlights from your journal
- Reflect with guided questions

## API Usage

### Create Entry

```bash
POST /api/v1/journal/entries/
{
  "title": "My Day",
  "content": "Today was great...",
  "entry_date": "2024-01-15",
  "mood": "mood_id",
  "tags": ["tag_id1", "tag_id2"],
  "template": "template_id"
}
```

### Get Entries

```bash
GET /api/v1/journal/entries/
GET /api/v1/journal/entries/?favorites=true
GET /api/v1/journal/entries/?start_date=2024-01-01&end_date=2024-01-31
```

### Search Entries

```bash
POST /api/v1/journal/entries/search/
{
  "q": "gratitude",
  "tags": ["tag_id"],
  "start_date": "2024-01-01",
  "min_sentiment": "0.3"
}
```

### Get Streak

```bash
GET /api/v1/journal/streaks/mine/
```

### Get Analytics

```bash
GET /api/v1/journal/stats/dashboard/
```

## Tips for Effective Journaling

1. **Be Consistent** - Try to journal every day to build your streak
2. **Use Prompts** - When stuck, use prompts to get started
3. **Track Mood** - Regular mood tracking reveals patterns
4. **Review Regularly** - Use Memory Lane to reflect on past entries
5. **Use Tags** - Organize entries with meaningful tags
6. **Try Templates** - Different templates for different purposes
7. **Be Honest** - Your journal is private - write freely
8. **Review Analytics** - Check your stats periodically for insights

## Common Use Cases

### Morning Routine
1. Go to `/journal/new`
2. Select "Morning Pages" template
3. Check in with your mood
4. Write your intentions for the day
5. Save

### Evening Reflection
1. Go to `/journal/new`
2. Select "Evening Reflection" template
3. Review your day
4. Track your mood and energy
5. Write 3 things you're grateful for
6. Save

### Weekly Review
1. Go to `/journal/new`
2. Select "Weekly Review" template
3. Review wins and challenges
4. Check goal progress
5. Plan next week
6. Save

### Quick Mood Check
1. Create a quick mood entry
2. Rate your mood (1-5)
3. Add energy/stress/sleep levels
4. Add brief notes
5. Save

### Past Reflection
1. Go to `/journal`
2. Click "Memory Lane"
3. Review random past entries
4. Reflect with guided questions
5. Learn from your past self

## Dashboard Metrics

- **Total Entries** - All entries ever written
- **Total Words** - Sum of all word counts
- **Current Streak** - Consecutive days
- **Consistency Score** - Overall consistency (0-100%)
- **Average Mood** - Mean mood rating
- **Mood Trend** - improving/declining/stable
- **Writing Velocity** - increasing/decreasing/stable
- **Most Productive Day** - Best day of week
- **Avg Entries/Week** - Weekly average

## Troubleshooting

### Streak Not Updating
- Make sure you're creating entries on consecutive days
- Check your entry date is correct
- Refresh the page

### Mood Not Showing
- Create a mood record before or with your entry
- Check the mood date matches entry date

### Search Not Working
- Check your search query
- Ensure filters are correct
- Try clearing filters

### Templates Not Loading
- Run `python manage.py init_journal_data`
- Check system templates are available
- Refresh the page

## Support

For issues or questions:
- Check the main README
- Review API documentation at `/api/docs/`
- Review JOURNAL_IMPLEMENTATION.md for technical details

## Privacy

- All journal entries are private to your account
- Is_private flag allows additional privacy marking
- No data is shared with other users

Enjoy journaling! 📝

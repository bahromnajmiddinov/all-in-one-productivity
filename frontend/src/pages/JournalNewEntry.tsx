import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen, Lightbulb, Smile, Tag as TagIcon, Calendar } from 'lucide-react';
import { journalApi } from '../api';
import type { JournalTemplate, JournalPrompt, JournalTag, JournalMood } from '../types';

export function JournalNewEntry() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [tags, setTags] = useState<JournalTag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadDailyPrompt();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesRes, promptsRes, tagsRes] = await Promise.all([
        journalApi.getSystemTemplates(),
        journalApi.getPrompts(),
        journalApi.getTags(),
      ]);
      setTemplates(templatesRes.data);
      setPrompts(promptsRes.data.results || promptsRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyPrompt = async () => {
    try {
      const res = await journalApi.getDailyPrompt();
      setSelectedPrompt(res.data);
    } catch (error) {
      console.error('Failed to load daily prompt:', error);
    }
  };

  const applyTemplate = async (template: JournalTemplate) => {
    setSelectedTemplate(template);
    
    // Apply template content
    let templateContent = template.content;
    
    // Replace {{prompt}} with the prompt question if available
    if (selectedPrompt) {
      templateContent = templateContent.replace('{{prompt}}', selectedPrompt.question);
    }
    
    setContent(templateContent);
    
    // Apply default tags
    if (template.default_tags && template.default_tags.length > 0) {
      setSelectedTags(template.default_tags.map((t: JournalTag) => t.id));
    }
  };

  const applyPrompt = (prompt: JournalPrompt) => {
    setSelectedPrompt(prompt);
    
    // Append prompt to content if not empty
    if (content) {
      setContent(`${content}\n\n### ${prompt.question}\n`);
    } else {
      setContent(`### ${prompt.question}\n`);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Please write something in your entry');
      return;
    }

    try {
      setSaving(true);

      // Create mood if any mood data is provided
      let moodId: string | undefined;
      if (mood !== null) {
        const moodRes = await journalApi.createMood({
          mood,
          energy_level: energyLevel || undefined,
          stress_level: stressLevel || undefined,
          sleep_quality: sleepQuality || undefined,
          date: entryDate,
        });
        moodId = moodRes.data.id;
      }

      // Create the entry
      const entryRes = await journalApi.createEntry({
        title: title || undefined,
        content,
        entry_date: entryDate,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        template: selectedTemplate?.id,
        prompt: selectedPrompt?.id,
        mood: moodId,
      });

      navigate(`/journal/${entryRes.data.id}`);
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getMoodEmoji = (value: number) => {
    switch (value) {
      case 5: return '😄';
      case 4: return '🙂';
      case 3: return '😐';
      case 2: return '😔';
      case 1: return '😞';
      default: return '';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/journal"
          className="flex items-center gap-2 text-fg-muted hover:text-foreground transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Templates */}
        <div className="p-4 bg-bg-elevated rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Templates
          </h3>
          <div className="space-y-2">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="w-full text-left px-3 py-2 rounded hover:bg-bg-subtle transition-smooth text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{template.icon}</span>
                  <span className="text-foreground">{template.name}</span>
                </div>
                <p className="text-xs text-fg-muted mt-1">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Prompt */}
        <div className="p-4 bg-bg-elevated rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Daily Prompt
          </h3>
          {selectedPrompt ? (
            <div className="space-y-3">
              <div className="p-3 bg-bg-subtle rounded">
                <p className="text-sm text-foreground">{selectedPrompt.question}</p>
                {selectedPrompt.suggestions && (
                  <p className="text-xs text-fg-muted mt-2">{selectedPrompt.suggestions}</p>
                )}
              </div>
              <button
                onClick={() => applyPrompt(selectedPrompt)}
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-smooth"
              >
                Use This Prompt
              </button>
              <button
                onClick={loadDailyPrompt}
                className="w-full px-3 py-2 border border-border rounded text-sm hover:bg-bg-subtle transition-smooth"
              >
                Get New Prompt
              </button>
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Loading prompt...</p>
          )}
        </div>

        {/* Mood Check-in */}
        <div className="p-4 bg-bg-elevated rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Smile className="w-4 h-4" />
            Mood Check-in
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-fg-muted mb-1 block">How are you feeling?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setMood(mood === value ? null : value)}
                    className={`flex-1 py-2 rounded text-2xl transition-smooth ${
                      mood === value
                        ? 'bg-primary text-primary-foreground scale-110'
                        : 'hover:bg-bg-subtle'
                    }`}
                    title={value === 1 ? 'Terrible' : value === 2 ? 'Bad' : value === 3 ? 'Okay' : value === 4 ? 'Good' : 'Amazing'}
                  >
                    {getMoodEmoji(value)}
                  </button>
                ))}
              </div>
            </div>
            
            {mood && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div>
                  <label className="text-xs text-fg-muted mb-1 block">Energy Level</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel || 5}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-fg-muted">
                    <span>Low</span>
                    <span>{energyLevel || 5}/10</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-fg-muted mb-1 block">Stress Level</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel || 5}
                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-fg-muted">
                    <span>Low</span>
                    <span>{stressLevel || 5}/10</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-fg-muted mb-1 block">Sleep Quality</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sleepQuality || 5}
                    onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-fg-muted">
                    <span>Poor</span>
                    <span>{sleepQuality || 5}/10</span>
                    <span>Great</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="space-y-4">
        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-fg-muted" />
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="px-3 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title (optional)..."
          className="w-full px-4 py-3 text-2xl font-bold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
        />

        {/* Tags */}
        <div>
          <label className="text-sm text-fg-muted mb-2 block flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag.id)
                      ? prev.filter(id => id !== tag.id)
                      : [...prev, tag.id]
                  );
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-smooth ${
                  selectedTags.includes(tag.id)
                    ? 'text-white'
                    : 'bg-bg-subtle text-fg-muted hover:text-foreground'
                }`}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your journal entry..."
            rows={20}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-y font-mono"
          />
          <div className="absolute bottom-4 right-4 text-xs text-fg-muted bg-bg-elevated px-2 py-1 rounded">
            {content.trim().split(/\s+/).filter(word => word.length > 0).length} words
          </div>
        </div>
      </div>
    </div>
  );
}

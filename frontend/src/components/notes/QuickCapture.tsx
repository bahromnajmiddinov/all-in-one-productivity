import { useState } from 'react';
import { notesApi } from '../../api';
import { Mic, Link, Image, FileText, Sparkles, X } from 'lucide-react';
import type { NoteFolder, NoteTag } from '../../types/notes';

interface Props {
  folders: NoteFolder[];
  tags: NoteTag[];
  onCapture: () => void;
}

type CaptureType = 'text' | 'voice' | 'web_clip' | 'image';

export function QuickCapture({ folders, tags, onCapture }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>('text');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [autoConvert, setAutoConvert] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const captureTypes: { type: CaptureType; label: string; icon: typeof FileText }[] = [
    { type: 'text', label: 'Text', icon: FileText },
    { type: 'voice', label: 'Voice', icon: Mic },
    { type: 'web_clip', label: 'Web Clip', icon: Link },
    { type: 'image', label: 'Image', icon: Image },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && captureType === 'text') return;
    if (!sourceUrl.trim() && captureType === 'web_clip') return;

    setSubmitting(true);
    try {
      const data = {
        capture_type: captureType,
        content: captureType === 'web_clip' ? sourceUrl : content,
        title: title || undefined,
        folder: selectedFolder || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        auto_convert: autoConvert,
      };

      await notesApi.quickCapture(data);
      
      // Reset form
      setContent('');
      setTitle('');
      setSourceUrl('');
      setSelectedFolder('');
      setSelectedTags([]);
      setIsOpen(false);
      onCapture();
    } catch (error) {
      console.error('Quick capture failed', error);
      alert('Failed to capture. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceCapture = () => {
    // Placeholder for voice recording functionality
    // In a real implementation, this would use the Web Speech API or MediaRecorder
    setIsRecording(!isRecording);
    if (!isRecording) {
      setContent('Voice recording started... (Feature coming soon)');
    } else {
      setContent('Voice recording stopped. Transcription would appear here.');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="size-5" strokeWidth={1.5} />
        <span className="font-medium">Quick Capture</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-bg-elevated rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Quick Capture</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-bg-subtle rounded-lg transition-colors"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Capture Type Tabs */}
        <div className="flex p-2 gap-1 border-b border-border">
          {captureTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setCaptureType(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                captureType === type
                  ? 'bg-primary/10 text-primary'
                  : 'text-fg-subtle hover:bg-bg-subtle'
              }`}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)..."
              className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Content based on capture type */}
          {captureType === 'web_clip' ? (
            <div>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Paste URL here..."
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          ) : captureType === 'voice' ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVoiceCapture}
                className={`w-full py-8 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center gap-3 ${
                  isRecording
                    ? 'border-red-400 bg-red-50'
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
              >
                <Mic className={`size-10 ${isRecording ? 'text-red-500 animate-pulse' : 'text-fg-subtle'}`} strokeWidth={1.5} />
                <span className={isRecording ? 'text-red-600 font-medium' : 'text-fg-subtle'}>
                  {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                </span>
              </button>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Transcription will appear here..."
                rows={4}
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          ) : (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter your ${captureType === 'image' ? 'image description or paste image URL' : 'note content'}...`}
                rows={6}
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                required={captureType === 'text'}
              />
            </div>
          )}

          {/* Organization */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-fg-subtle mb-1.5 block">Folder</label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">No folder</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-fg-subtle mb-1.5 block">Tags</label>
              <select
                multiple
                value={selectedTags}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, o => o.value);
                  setSelectedTags(options);
                }}
                className="w-full px-3 py-2 bg-bg-subtle border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                size={1}
              >
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id} style={{ color: tag.color }}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-convert option */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoConvert}
              onChange={(e) => setAutoConvert(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-fg-subtle">Convert to note immediately</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-fg-subtle hover:bg-bg-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!content.trim() && captureType === 'text') || (!sourceUrl.trim() && captureType === 'web_clip')}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" strokeWidth={1.5} />
                  Capture
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

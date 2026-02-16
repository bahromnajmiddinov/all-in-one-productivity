import { useState, useCallback, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Code, Link, Quote, Heading1, Heading2, Heading3, Eye, EyeOff, CheckSquare } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({ value, onChange, placeholder, rows = 12 }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Heading1, action: () => insertMarkdown('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### '), title: 'Heading 3' },
    { icon: List, action: () => insertMarkdown('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Numbered List' },
    { icon: CheckSquare, action: () => insertMarkdown('- [ ] '), title: 'Task List' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('```\n', '\n```'), title: 'Code Block' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
  ];

  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-bg-subtle p-3 rounded-lg my-3 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-bg-subtle px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener">$1</a>')
      // Wiki links [[Note Title]]
      .replace(/\[\[([^\]]+)\]\]/g, '<span class="text-primary bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors">📎 $1</span>')
      // Lists
      .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded border-border" /><span>$1</span></div>')
      .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded border-border" /><span class="line-through text-fg-subtle">$1</span></div>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 my-1">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1 list-decimal">$1</li>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 my-3 italic text-fg-subtle">$1</blockquote>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="my-4 border-border" />')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-bg-elevated">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-bg-subtle flex-wrap">
        {toolbarButtons.map(({ icon: Icon, action, title }) => (
          <button
            key={title}
            type="button"
            onClick={action}
            className="p-1.5 hover:bg-bg-elevated rounded transition-colors"
            title={title}
          >
            <Icon className="size-4 text-fg-subtle" strokeWidth={1.5} />
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-2 py-1 text-sm text-fg-subtle hover:text-foreground transition-colors"
        >
          {showPreview ? (
            <>
              <EyeOff className="size-4" strokeWidth={1.5} />
              Edit
            </>
          ) : (
            <>
              <Eye className="size-4" strokeWidth={1.5} />
              Preview
            </>
          )}
        </button>
      </div>

      {/* Editor / Preview */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-4 py-3 bg-bg-elevated focus:outline-none resize-none font-mono text-sm leading-relaxed ${
            showPreview ? 'opacity-0 absolute inset-0' : 'opacity-100'
          }`}
          style={{ minHeight: `${rows * 1.5}rem` }}
        />
        {showPreview && (
          <div
            className="w-full px-4 py-3 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>

      {/* Helper text */}
      <div className="px-3 py-2 bg-bg-subtle border-t border-border text-xs text-fg-subtle flex items-center justify-between">
        <span>Supports Markdown formatting</span>
        <span>Use [[Note Title]] to link notes</span>
      </div>
    </div>
  );
}

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm text-foreground transition-fast',
            'placeholder:text-fg-subtle',
            'focus-visible:outline-none focus-visible:border-border-hover focus-visible:ring-2 focus-visible:ring-ring/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-subtle',
            'resize-y',
            error && 'border-destructive focus-visible:ring-destructive/20',
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-caption">{helperText}</p>
        )}
        {error && (
          <p className="text-caption text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };

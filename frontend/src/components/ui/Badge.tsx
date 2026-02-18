import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium transition-fast',
        
        // Size variants
        size === 'sm' && 'px-2 py-0.5 text-xs rounded-full',
        size === 'md' && 'px-2.5 py-1 text-sm rounded-[var(--radius-sm)]',
        
        // Color variants
        variant === 'default' && 'bg-foreground text-background',
        variant === 'secondary' && 'bg-bg-subtle text-foreground border border-border',
        variant === 'success' && 'bg-success-subtle text-success',
        variant === 'warning' && 'bg-warning-subtle text-warning',
        variant === 'destructive' && 'bg-destructive-subtle text-destructive',
        variant === 'outline' && 'bg-transparent text-foreground border border-border',
        
        className
      )}
    >
      {children}
    </span>
  );
}

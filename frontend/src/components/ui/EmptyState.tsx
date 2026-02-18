import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        'rounded-[var(--radius)] border border-dashed border-border bg-bg-subtle/30',
        className
      )}
    >
      {icon && (
        <div className="mb-4 p-3 rounded-full bg-bg-elevated text-fg-muted">
          {icon}
        </div>
      )}
      <h3 className="text-h4 text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-body-sm text-fg-muted max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

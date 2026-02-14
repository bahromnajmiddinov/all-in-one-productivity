import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center rounded-[var(--radius)] border border-dashed border-border-subtle bg-bg-subtle/50',
        className
      )}
    >
      {icon && (
        <div className="mb-3 text-fg-subtle [&>svg]:size-10">{icon}</div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-fg-muted max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

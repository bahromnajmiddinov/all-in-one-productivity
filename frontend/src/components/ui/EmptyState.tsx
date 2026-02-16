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
        'flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl border border-dashed border-border-subtle bg-bg-subtle/30',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-fg-subtle [&>svg]:w-12 [&>svg]:h-12 opacity-60">{icon}</div>
      )}
      <p className="text-base font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-fg-muted max-w-[280px] mb-4">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

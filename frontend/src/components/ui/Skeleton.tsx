import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text';
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'default',
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-bg-subtle';
  
  const variantClasses = {
    default: 'rounded-[var(--radius-sm)]',
    circle: 'rounded-full',
    text: 'rounded-[var(--radius-sm)]',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant],
              'h-4',
              i === lines - 1 && 'w-4/5'
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg-elevated p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20" />
    </div>
  );
}

export function ListItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="flex items-center gap-3 p-3 rounded-[var(--radius)] border border-border bg-bg-elevated"
        >
          <Skeleton className="h-8 w-8" variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-2 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="p-5 rounded-[var(--radius)] border border-border bg-bg-elevated space-y-3"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

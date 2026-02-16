import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'metric';
  lines?: number;
}

export function Skeleton({ className, variant = 'rectangular', lines = 1 }: SkeletonProps) {
  if (variant === 'circular') {
    return (
      <div className={cn('w-10 h-10 rounded-full bg-bg-subtle animate-pulse', className)} />
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-bg-subtle rounded animate-pulse',
              className,
              i === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1.2s',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="rounded-lg border border-border bg-bg-elevated p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-bg-subtle animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-bg-subtle rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-bg-subtle rounded w-1/3 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-bg-subtle rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-bg-subtle rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === 'metric') {
    return (
      <div className="rounded-lg border border-border bg-bg-elevated p-6 space-y-2">
        <div className="h-4 bg-bg-subtle rounded w-2/3 animate-pulse" />
        <div className="h-8 bg-bg-subtle rounded w-1/2 animate-pulse" />
        <div className="h-3 bg-bg-subtle rounded w-1/3 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-4 bg-bg-subtle rounded animate-pulse',
        className,
        variant === 'rectangular' && 'w-full'
      )}
    />
  );
}

// Skeleton variants for common patterns
export function MetricSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" />
        </div>
        <div className="w-12 h-12 rounded-full bg-bg-subtle animate-pulse" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div 
          className="bg-bg-subtle rounded animate-pulse"
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
}
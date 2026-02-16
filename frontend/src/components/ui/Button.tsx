import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-foreground text-background hover:opacity-90 active:opacity-80 shadow-sm': variant === 'primary',
            'bg-bg-subtle text-foreground border border-border hover:bg-bg-hover hover:border-border/80': variant === 'secondary',
            'bg-transparent text-fg-muted hover:text-foreground hover:bg-bg-subtle active:bg-bg-hover': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm': variant === 'destructive',
            'bg-transparent border border-border text-foreground hover:bg-bg-subtle hover:border-border/80': variant === 'outline',
          },
          {
            'h-8 px-3 text-xs gap-1.5': size === 'sm',
            'h-10 px-4 text-sm gap-2': size === 'md',
            'h-12 px-6 text-sm gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

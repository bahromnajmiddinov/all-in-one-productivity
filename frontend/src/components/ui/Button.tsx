import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-smooth rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-foreground text-background hover:opacity-90 active:opacity-95': variant === 'primary',
            'bg-bg-subtle text-foreground border border-border hover:bg-bg-elevated': variant === 'secondary',
            'text-foreground hover:bg-bg-subtle active:bg-bg-elevated': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:opacity-90': variant === 'destructive',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-sm': size === 'lg',
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

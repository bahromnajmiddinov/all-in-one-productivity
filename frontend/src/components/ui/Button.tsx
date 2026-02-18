import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    disabled,
    isLoading,
    leftIcon,
    rightIcon,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || isLoading;
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-sm)] transition-all duration-fast ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Variant styles
          {
            'bg-foreground text-background hover:opacity-90 active:opacity-85 shadow-sm': variant === 'primary',
            'bg-bg-subtle text-foreground border border-border hover:bg-bg-hover hover:border-border-hover': variant === 'secondary',
            'bg-transparent text-fg-muted hover:text-foreground hover:bg-bg-subtle active:bg-bg-hover': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm': variant === 'destructive',
            'bg-transparent border border-border text-foreground hover:bg-bg-subtle hover:border-border-hover': variant === 'outline',
            'bg-accent text-white hover:opacity-90 active:opacity-85 shadow-sm': variant === 'subtle',
          },
          
          // Size styles
          {
            'h-7 px-2.5 text-xs gap-1': size === 'xs',
            'h-8 px-3 text-xs gap-1.5': size === 'sm',
            'h-10 px-4 text-sm gap-2': size === 'md',
            'h-11 px-5 text-sm gap-2': size === 'lg',
          },
          
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg 
            className="animate-spin -ml-0.5 mr-1.5 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

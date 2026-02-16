import { cn } from '../../lib/utils';

interface CircularProgressProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  showValue?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const sizeConfig = {
  sm: { size: 40, text: 'text-xs' },
  md: { size: 56, text: 'text-sm' },
  lg: { size: 80, text: 'text-base' },
};

const variantConfig = {
  primary: { color: '#3B82F6', bgColor: '#1E293B' },
  success: { color: '#10B981', bgColor: '#1E293B' },
  warning: { color: '#F59E0B', bgColor: '#1E293B' },
  danger: { color: '#EF4444', bgColor: '#1E293B' },
};

export function CircularProgress({ 
  value, 
  size = 'md', 
  strokeWidth = 4, 
  showValue = true,
  variant = 'primary',
  className 
}: CircularProgressProps) {
  const config = sizeConfig[size];
  const colors = variantConfig[variant];
  const radius = (config.size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={colors.bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={colors.color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-semibold text-foreground', config.text)}>
            {value}%
          </span>
        </div>
      )}
    </div>
  );
}
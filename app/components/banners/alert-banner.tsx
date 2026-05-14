import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Card, Text, cn } from '~/ui';

interface AlertBannerProps {
  title: string;
  description?: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  className?: string;
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    className: 'border-flash-error-border bg-flash-error-bg text-flash-error-text [&>svg]:text-flash-error-icon-bg',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-flash-warning-border bg-flash-warning-bg text-flash-warning-text [&>svg]:text-flash-warning-icon-bg',
  },
  info: {
    icon: Info,
    className: 'border-flash-info-border bg-flash-info-bg text-flash-info-text [&>svg]:text-flash-info-icon-bg',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-flash-success-border bg-flash-success-bg text-flash-success-text [&>svg]:text-flash-success-icon-bg',
  },
};

export function AlertBanner({ title, description, variant = 'info', className = '' }: AlertBannerProps) {
  const { icon: Icon, className: variantClasses } = variantConfig[variant];

  return (
    <Card
      size="sm"
      className={cn(
        'flex flex-row items-start gap-2 rounded-md px-2 py-1.5 text-xs leading-tight shadow-sm',
        variantClasses,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <div>
        <Text as="p" variant="body-sm" className="font-medium text-current">
          {title}
        </Text>
        {description ? (
          <Text as="p" variant="caption" className="mt-0.5 text-current">
            {description}
          </Text>
        ) : null}
      </div>
    </Card>
  );
}

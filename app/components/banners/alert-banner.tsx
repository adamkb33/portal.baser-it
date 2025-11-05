import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // optional, if you have a `cn` helper for class merging

interface AlertBannerProps {
  title: string;
  description?: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  className?: string;
}

const variantConfig = {
  error: {
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600',
  },
  warning: {
    variant: 'default' as const,
    icon: AlertTriangle,
    className: 'border-orange-200 bg-orange-50 text-orange-800 [&>svg]:text-orange-600',
  },
  info: {
    variant: 'default' as const,
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600',
  },
  success: {
    variant: 'default' as const,
    icon: CheckCircle2,
    className: 'border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600',
  },
};

export function AlertBanner({ title, description, variant = 'info', className = '' }: AlertBannerProps) {
  const { icon: Icon, variant: alertVariant, className: variantClasses } = variantConfig[variant];

  return (
    <Alert
      variant={alertVariant}
      className={cn(
        'flex items-start gap-2 py-1.5 px-2 text-xs leading-tight rounded-md shadow-sm',
        variantClasses,
        className,
      )}
    >
      <Icon className="mt-[2px] h-3.5 w-3.5 shrink-0" />
      <div>
        <AlertTitle className="font-medium text-sm">{title}</AlertTitle>
        {description && <AlertDescription className="text-[11px] text-gray-700 mt-0.5">{description}</AlertDescription>}
      </div>
    </Alert>
  );
}

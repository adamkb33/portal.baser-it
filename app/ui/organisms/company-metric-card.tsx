import { Text } from '../atoms/text';
import { cn } from '../lib/cn';
import { Card, CardContent, type CardProps } from './card';

export interface CompanyMetricCardProps extends Omit<CardProps, 'children'> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
}

export function CompanyMetricCard({
  label,
  value,
  icon,
  meta,
  className,
  ...props
}: CompanyMetricCardProps) {
  return (
    <Card variant="default" size="sm" className={cn('bg-surface', className)} {...props}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {label}
            </Text>
            <Text as="p" variant="heading-md">
              {value}
            </Text>
          </div>
          {icon ? <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-text-secondary">{icon}</div> : null}
        </div>
        {meta ? (
          <Text as="p" variant="caption" className="text-text-secondary">
            {meta}
          </Text>
        ) : null}
      </CardContent>
    </Card>
  );
}

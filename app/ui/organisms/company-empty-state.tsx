import { Text } from '../atoms/text';
import { cn } from '../lib/cn';
import { Card, CardContent } from './card';

export interface CompanyEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CompanyEmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: CompanyEmptyStateProps) {
  return (
    <Card variant="subtle" className={cn('bg-background', className)} {...props}>
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text-secondary">{icon}</div> : null}
        <div className="space-y-1">
          <Text as="p" variant="heading-sm">
            {title}
          </Text>
          {description ? (
            <Text as="p" variant="body-sm" className="max-w-md text-text-secondary">
              {description}
            </Text>
          ) : null}
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

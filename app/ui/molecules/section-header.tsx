import { Text } from '../atoms/text';
import { cn } from '../lib/cn';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ label, title, description, action, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-start md:justify-between', className)} {...props}>
      <div className="min-w-0 flex-1 space-y-1">
        {label ? (
          <Text as="p" variant="overline" className="text-text-secondary">
            {label}
          </Text>
        ) : null}
        <Text as="h2" variant="heading-sm">
          {title}
        </Text>
        {description ? (
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {description}
          </Text>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

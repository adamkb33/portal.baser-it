import { Text } from '../atoms/text';
import { cn } from '../lib/cn';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  label?: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
}

export function PageHeader({ label, title, description, meta, className, ...props }: PageHeaderProps) {
  return (
    <header className={cn('pb-4 md:border-b md:border-border md:pb-6', className)} {...props}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {label ? (
            <Text as="p" variant="overline" className="text-text-secondary">
              {label}
            </Text>
          ) : null}
          <Text as="h1" variant="heading-lg">
            {title}
          </Text>
          {description ? (
            <Text as="p" variant="body" className="text-text-secondary">
              {description}
            </Text>
          ) : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </header>
  );
}

import { Text } from '../atoms/text';
import { Container, type ContainerSize } from '../layout/container';
import { Stack } from '../layout/stack';
import { cn } from '../lib/cn';

export interface PageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  label?: string;
  routeLinks?: React.ReactNode;
  actions?: React.ReactNode;
  hero?: React.ReactNode;
  children: React.ReactNode;
  size?: ContainerSize;
}

export function PageTemplate({
  title,
  description,
  label,
  routeLinks,
  actions,
  hero,
  children,
  size = '2xl',
  className,
  ...props
}: PageTemplateProps) {
  return (
    <Container size={size} className={cn('space-y-5', className)} {...props}>
      <section className="space-y-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            {label ? (
              <Text as="p" variant="overline" className="text-text-secondary">
                {label}
              </Text>
            ) : null}
            <Text as="h1" variant="heading-lg">
              {title}
            </Text>
            {description ? (
              <Text as="p" variant="body" className="max-w-3xl text-text-secondary">
                {description}
              </Text>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {routeLinks ? <div className="flex flex-wrap items-center gap-2">{routeLinks}</div> : null}
      </section>

      {hero ? <div>{hero}</div> : null}

      <Stack space="lg">{children}</Stack>
    </Container>
  );
}

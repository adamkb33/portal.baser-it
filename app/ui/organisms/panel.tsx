import { Text } from '../atoms/text';
import type { SectionHeaderProps } from '../molecules/section-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, type CardVariant } from './card';

export type PanelTone = 'default' | 'muted' | 'emphasis';

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  label?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  tone?: PanelTone;
  variant?: 'default' | 'muted' | 'elevated';
  as?: 'section' | 'div' | 'article' | 'aside';
  children: React.ReactNode;
}

const toneClasses: Record<PanelTone, CardVariant> = {
  default: 'default',
  muted: 'subtle',
  emphasis: 'emphasis',
};

export function Panel({
  label,
  title,
  description,
  action,
  tone = 'default',
  variant,
  as: Component = 'section',
  className,
  children,
  ...props
}: PanelProps) {
  const resolvedTone: PanelTone = variant === 'elevated' ? 'emphasis' : variant === 'muted' ? 'muted' : tone;
  const headerProps: SectionHeaderProps | null = title
    ? {
        label,
        title,
        description,
        action,
      }
    : null;

  return (
    <Card as={Component} variant={toneClasses[resolvedTone]} className={className} {...props}>
      {headerProps ? (
        <CardHeader>
          {headerProps.label ? (
            <Text as="p" variant="overline" className="text-text-secondary">
              {headerProps.label}
            </Text>
          ) : null}
          <CardTitle>{headerProps.title}</CardTitle>
          {headerProps.description ? <CardDescription>{headerProps.description}</CardDescription> : null}
          {headerProps.action ? <div className="pt-2">{headerProps.action}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

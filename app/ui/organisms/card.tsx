import { Text } from '../atoms/text';
import { cn } from '../lib/cn';
import { insetSpaceClasses, type InsetSpace } from '../lib/spacing';

export type CardVariant = 'default' | 'subtle' | 'emphasis' | 'interactive' | 'ghost' | 'bordered';
export type CardSize = InsetSpace;

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  size?: CardSize;
  as?: 'div' | 'section' | 'article' | 'aside';
}

const variantClasses: Record<CardVariant, string> = {
  default: 'border-border bg-surface shadow-[var(--shadow-card)]',
  subtle: 'border-border bg-background shadow-[var(--shadow-card)]',
  emphasis: 'border-interactive bg-surface shadow-[var(--shadow-panel)]',
  interactive: 'border-border bg-background shadow-[var(--shadow-card)] transition-colors hover:bg-surface',
  ghost: 'border-transparent bg-background',
  bordered: 'border-border bg-surface shadow-[var(--shadow-card)]',
};

export function Card({ variant = 'default', size = 'md', as: Component = 'div', className, ...props }: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-[var(--radius-card)] border-[length:var(--border-card)]',
        variantClasses[variant],
        insetSpaceClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ as = 'h3', className, children, ...props }: CardTitleProps) {
  return (
    <Text as={as} variant="heading-sm" className={cn(className)} {...props}>
      {children}
    </Text>
  );
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <Text as="p" variant="body-sm" className={cn('text-text-secondary', className)} {...props}>
      {children}
    </Text>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('space-y-4', className)} {...props} />;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('mt-4 border-t-[length:var(--border-card)] border-border pt-4', className)} {...props} />;
}

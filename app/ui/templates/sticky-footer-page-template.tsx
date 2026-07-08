import { Container, type ContainerSize } from '../layout/container';
import { cn } from '../lib/cn';

export interface StickyFooterPageTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ContainerSize;
  footerClassName?: string;
}

export function StickyFooterPageTemplate({
  children,
  footer,
  size = 'lg',
  className,
  footerClassName,
  ...props
}: StickyFooterPageTemplateProps) {
  return (
    <div className={cn('flex min-h-full flex-col', className)} {...props}>
      <div className="min-h-0 flex-1">{children}</div>

      {footer ? (
        <div
          className={cn('sticky z-20 mt-6 border-t border-border bg-background', footerClassName)}
          style={{ bottom: 'calc(var(--app-content-padding-block-current) * -1)' }}
        >
          <Container
            size={size}
            className="px-4 py-3 md:px-6"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--space-sm))' }}
          >
            {footer}
          </Container>
        </div>
      ) : null}
    </div>
  );
}

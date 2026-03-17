import { Container, type ContainerSize } from '../layout/container';
import { Stack } from '../layout/stack';
import { cn } from '../lib/cn';
import { PageHeader } from '../organisms/page-header';
import { StickyFooterPageTemplate } from './sticky-footer-page-template';

export interface BookingStepTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  label?: string;
  headerMeta?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: ContainerSize;
  contentClassName?: string;
}

export function BookingStepTemplate({
  title,
  description,
  label,
  headerMeta,
  footer,
  children,
  size = 'lg',
  className,
  contentClassName,
  ...props
}: BookingStepTemplateProps) {
  return (
    <StickyFooterPageTemplate footer={footer} size={size} className={className} {...props}>
      <Container size={size}>
        <Stack space="xl" className={cn(contentClassName)}>
          <PageHeader label={label} title={title} description={description} meta={headerMeta} />
          {children}
        </Stack>
      </Container>
    </StickyFooterPageTemplate>
  );
}

import { cn } from '../lib/cn';
import { Notice } from './notice';

export interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: React.ReactNode;
  sticky?: boolean;
}

export function AlertBanner({ title = 'Noe gikk galt', message, sticky = false, className, ...props }: AlertBannerProps) {
  return (
    <Notice
      title={title}
      message={message ?? ''}
      tone="emphasis"
      className={cn(sticky && 'sticky top-0 z-10', className)}
      {...props}
    />
  );
}

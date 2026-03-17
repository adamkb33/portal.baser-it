import { cn } from '../lib/cn';

export interface ResponsiveSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  mobile?: React.ReactNode;
  desktop?: React.ReactNode;
  show?: boolean;
}

export function ResponsiveSummary({ mobile, desktop, show = true, className, ...props }: ResponsiveSummaryProps) {
  if (!show) return null;

  return (
    <div className={className} {...props}>
      {mobile}
      {desktop ? <div className={cn('hidden md:block')}>{desktop}</div> : null}
    </div>
  );
}

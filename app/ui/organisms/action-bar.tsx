import { cn } from '../lib/cn';

export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  align?: 'start' | 'end' | 'between';
  stackOnMobile?: boolean;
}

const alignClasses = {
  start: 'justify-start',
  end: 'justify-end',
  between: 'justify-between',
} as const;

export function ActionBar({
  primary,
  secondary,
  align = 'end',
  stackOnMobile = true,
  className,
  ...props
}: ActionBarProps) {
  return (
    <div
      className={cn(
        'flex gap-3 border-t border-border pt-4',
        stackOnMobile ? 'flex-col md:flex-row' : 'flex-row flex-wrap',
        alignClasses[align],
        className,
      )}
      {...props}
    >
      {secondary ? <div className="shrink-0">{secondary}</div> : null}
      {primary ? <div className="shrink-0">{primary}</div> : null}
    </div>
  );
}

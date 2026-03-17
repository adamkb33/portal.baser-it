import { cn } from '../lib/cn';
import { type Space, gapSpaceClasses } from '../lib/spacing';

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  space?: Space;
  justify?: 'start' | 'center' | 'end';
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
} as const;

export function Cluster({ space = 'md', justify = 'start', className, ...props }: ClusterProps) {
  return (
    <div className={cn('flex flex-wrap items-center', gapSpaceClasses[space], justifyClasses[justify], className)} {...props} />
  );
}

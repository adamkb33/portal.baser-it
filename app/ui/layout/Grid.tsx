import { cn } from '../lib/cn';
import { type Space, gapSpaceClasses } from '../lib/spacing';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  gap?: Space;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const;

export function Grid({ columns = 2, gap = 'lg', className, ...props }: GridProps) {
  return <div className={cn('grid', gapSpaceClasses[gap], columnClasses[columns], className)} {...props} />;
}

import { cn } from '../lib/cn';
import { type ContainerGutter, containerGutterClasses } from '../lib/spacing';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  gutter?: ContainerGutter;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-[var(--container-2xl)]',
};

export function Container({ size = 'xl', gutter = 'md', className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full', containerGutterClasses[gutter], sizeClasses[size], className)} {...props} />;
}

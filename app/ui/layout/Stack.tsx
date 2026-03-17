import { cn } from '../lib/cn';
import { type Space, stackSpaceClasses } from '../lib/spacing';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  space?: Space;
}

export function Stack({ space = 'md', className, ...props }: StackProps) {
  return <div className={cn(stackSpaceClasses[space], className)} {...props} />;
}

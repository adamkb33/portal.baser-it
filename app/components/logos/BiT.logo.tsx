import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BiTLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function BiTLogo({ size = 'md', className, ...props }: BiTLogoProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }[size];

  return (
    <span className={cn('font-bold inline-flex gap-1 items-center tracking-tight', sizeClasses, className)} {...props}>
      <span className="text-primary">B</span>
      <span className="text-secondary -mx-0.5">i</span>
      <span className="text-primary">T</span>
    </span>
  );
}

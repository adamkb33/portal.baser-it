import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BiTLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

export default function BiTLogo({ size = 'md', className, ...props }: BiTLogoProps) {
  const sizeClasses =
    typeof size === 'number'
      ? `text-[${size}px]`
      : {
          sm: 'text-sm',
          md: 'text-base',
          lg: 'text-2xl',
          xl: 'text-4xl',
        }[size];

  return (
    <span className={cn('font-semibold inline-flex', sizeClasses, className)} {...props}>
      <span className="text-[oklch(0.41_0.12_335)]">B</span>
      <span className="text-white">i</span>
      <span className="text-[oklch(0.41_0.12_335)]">T</span>
    </span>
  );
}

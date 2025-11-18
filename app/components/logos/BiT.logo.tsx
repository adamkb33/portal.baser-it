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
    <span className={cn('font-bold inline-flex gap-1 items-center tracking-tight', sizeClasses, className)} {...props}>
      <span className="relative text-[oklch(0.41_0.12_335)] drop-shadow-[0_0_8px_rgba(161,52,131,0.5)] hover:scale-110 transition-transform">
        B
      </span>
      <span className="relative text-white -mx-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">i</span>
      <span className="relative text-[oklch(0.41_0.12_335)] drop-shadow-[0_0_8px_rgba(161,52,131,0.5)] hover:scale-110 transition-transform">
        T
      </span>
      <span
        className="absolute inset-0 bg-gradient-to-r from-[oklch(0.41_0.12_335)] via-transparent to-[oklch(0.41_0.12_335)] opacity-20 blur-xl pointer-events-none"
        aria-hidden="true"
      />
    </span>
  );
}

import { cn } from '../lib/cn';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export function Link({ className, children, ...props }: LinkProps) {
  return (
    <a
      className={cn(
        'text-interactive underline transition-colors motion-safe:duration-fast motion-safe:ease-default hover:text-interactive-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

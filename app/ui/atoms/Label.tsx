import { cn } from '../lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium leading-normal tracking-wide text-text-primary', className)}
      {...props}
    >
      {children}
    </label>
  );
}

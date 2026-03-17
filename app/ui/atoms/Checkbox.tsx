import { cn } from '../lib/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ className, disabled, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded-sm border border-interactive bg-surface text-interactive',
        'cursor-pointer transition-colors motion-safe:duration-fast motion-safe:ease-default',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-interactive',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      disabled={disabled}
      onChange={(event) => {
        onCheckedChange?.(event.target.checked);
        props.onInput?.(event);
      }}
      {...props}
    />
  );
}

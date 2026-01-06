import * as React from 'react';
import { cn } from '~/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full border-2 border-form-border bg-form-bg text-form-text px-4 py-3 text-sm rounded-none',
          'placeholder:text-form-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-form-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:bg-form-disabled disabled:text-form-disabled-foreground',
          'aria-[invalid=true]:border-form-invalid aria-[invalid=true]:ring-form-invalid',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-form-text',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };

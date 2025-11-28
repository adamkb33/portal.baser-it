import * as React from 'react';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
}

export const ErrorMessage = React.forwardRef<HTMLElement, ErrorMessageProps>(
  ({ title = 'Feil', message, details }, ref) => {
    return (
      <section
        ref={ref}
        className={['border border-border', 'bg-muted', 'p-3 sm:p-4', 'space-y-2'].join(' ')}
        role="alert"
        aria-live="polite"
      >
        <p className={['text-xs', 'font-medium', 'uppercase', 'tracking-[0.12em]', 'text-muted-foreground'].join(' ')}>
          {title}
        </p>
        <p className={['text-[0.8rem]', 'text-foreground'].join(' ')}>{message}</p>
        {details && <p className={['text-[0.7rem]', 'text-muted-foreground'].join(' ')}>{details}</p>}
      </section>
    );
  },
);

ErrorMessage.displayName = 'ErrorMessage';

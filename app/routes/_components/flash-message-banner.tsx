import * as React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { FlashMessage } from '~/routes/company/_lib/flash-message.server';

interface FlashMessageProps {
  message: FlashMessage | null;
}

export function FlashMessageBanner({ message }: FlashMessageProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const safeMessage =
    message &&
    typeof message === 'object' &&
    'type' in message &&
    typeof message.type === 'string' &&
    'text' in message &&
    typeof message.text === 'string'
      ? message
      : null;

  React.useEffect(() => {
    if (safeMessage) {
      setIsVisible(true);
      const hideTimer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [safeMessage]);

  if (!safeMessage || !isVisible) {
    return null;
  }

  const config = {
    success: {
      icon: CheckCircle2,
      container: 'border-flash-success-border bg-flash-success-bg text-flash-success-text',
      iconWrap: 'bg-flash-success-icon-bg text-flash-success-icon-fg',
      closeHover: 'hover:bg-flash-success-border',
      accent: 'bg-flash-success-icon-bg',
    },
    error: {
      icon: AlertCircle,
      container: 'border-flash-error-border bg-flash-error-bg text-flash-error-text shadow-lg',
      iconWrap: 'bg-flash-error-icon-bg text-flash-error-icon-fg',
      closeHover: 'hover:bg-flash-error-border',
      accent: 'bg-flash-error-icon-bg',
    },
    info: {
      icon: Info,
      container: 'border-flash-info-border bg-flash-info-bg text-flash-info-text',
      iconWrap: 'bg-flash-info-icon-bg text-flash-info-icon-fg',
      closeHover: 'hover:bg-flash-info-border',
      accent: 'bg-flash-info-icon-bg',
    },
    warning: {
      icon: AlertTriangle,
      container: 'border-flash-warning-border bg-flash-warning-bg text-flash-warning-text',
      iconWrap: 'bg-flash-warning-icon-bg text-flash-warning-icon-fg',
      closeHover: 'hover:bg-flash-warning-border',
      accent: 'bg-flash-warning-icon-bg',
    },
  };

  const { icon: Icon, container, iconWrap, closeHover, accent } = config[safeMessage.type] ?? config.info;
  const isError = safeMessage.type === 'error';

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] p-4 pointer-events-none">
      <div
        role="status"
        aria-live={isError ? 'assertive' : 'polite'}
        className={`animate-in fade-in-0 slide-in-from-top-2 mx-auto w-full max-w-md pointer-events-auto overflow-hidden rounded-lg border shadow-md ${container}`}
      >
        <div className={`h-0.5 w-full ${accent}`} />
        <div className="flex items-start gap-3 p-4">
          <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconWrap}`}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="flex-1 text-sm font-medium leading-relaxed">{safeMessage.text}</p>
          <button
            onClick={() => setIsVisible(false)}
            className={`shrink-0 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 ${closeHover}`}
            aria-label="Lukk"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// components/layout/flash-message.tsx
import * as React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { FlashMessage } from '~/routes/company/_lib/flash-message.server';

interface FlashMessageProps {
  message: FlashMessage | null;
}

export function FlashMessageBanner({ message }: FlashMessageProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message || !isVisible) {
    return null;
  }

  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-background',
      iconBg: 'bg-foreground',
      iconColor: 'text-background',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-destructive',
      iconBg: 'bg-background',
      iconColor: 'text-destructive',
    },
    info: {
      icon: Info,
      bg: 'bg-background',
      iconBg: 'bg-primary',
      iconColor: 'text-primary-foreground',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-background',
      iconBg: 'bg-foreground',
      iconColor: 'text-background',
    },
  };

  const { icon: Icon, bg, iconBg, iconColor } = config[message.type];

  return (
    <div className="fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
      <div
        className={`border-2 border-border ${bg} p-4 shadow-lg animate-in slide-in-from-top-2 duration-300`}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center border border-border ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>

          <div className="flex-1 space-y-1 pt-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">{message.type}</p>
            <p className="text-sm font-medium text-foreground">{message.text}</p>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 border border-border bg-background p-1 text-foreground hover:bg-foreground hover:text-background transition-colors"
            aria-label="Close notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

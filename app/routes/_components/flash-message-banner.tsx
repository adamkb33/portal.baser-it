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
      const hideTimer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [message]);

  if (!message || !isVisible) {
    return null;
  }

  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-form-valid',
      text: 'text-form-valid-foreground',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-form-invalid',
      text: 'text-form-invalid-foreground',
    },
    info: {
      icon: Info,
      bg: 'bg-primary',
      text: 'text-primary-foreground',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-accent',
      text: 'text-accent-foreground',
    },
  };

  const { icon: Icon, bg, text } = config[message.type];

  return (
    <div className="fixed inset-x-0 top-0 z-50 p-4">
      <div className={`mx-auto flex max-w-md items-center gap-3 ${bg} ${text} p-4`}>
        <Icon className="h-5 w-5 shrink-0" />
        <p className="flex-1 text-sm font-medium">{message.text}</p>
        <button onClick={() => setIsVisible(false)} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Lukk">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

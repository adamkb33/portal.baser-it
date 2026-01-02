import * as React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { FlashMessage } from '~/routes/company/_lib/flash-message.server';

interface FlashMessageProps {
  message: FlashMessage | null;
}

export function FlashMessageBanner({ message }: FlashMessageProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsExiting(false);

      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 4500);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [message]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!message || !isVisible) {
    return null;
  }

  const config = {
    success: {
      icon: CheckCircle2,
      gradient: 'from-secondary/20 to-secondary/5',
      iconBg: 'bg-secondary',
      iconColor: 'text-background',
      accent: 'border-l-secondary',
      labelColor: 'text-muted-foreground',
      textColor: 'text-foreground',
    },
    error: {
      icon: AlertCircle,
      gradient: 'from-destructive/20 to-destructive/5',
      iconBg: 'bg-destructive',
      iconColor: 'text-background',
      accent: 'border-l-destructive',
      labelColor: 'text-muted-foreground',
      textColor: 'text-foreground',
    },
    info: {
      icon: Info,
      gradient: 'from-primary/20 to-primary/5',
      iconBg: 'bg-primary',
      iconColor: 'text-primary-foreground',
      accent: 'border-l-primary',
      labelColor: 'text-muted-foreground',
      textColor: 'text-foreground',
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-accent/25 to-accent/5',
      iconBg: 'bg-accent',
      iconColor: 'text-foreground',
      accent: 'border-l-accent',
      labelColor: 'text-muted-foreground',
      textColor: 'text-foreground',
    },
  };

  const { icon: Icon, gradient, iconBg, iconColor, accent, labelColor, textColor } = config[message.type];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center p-4 md:p-6">
      <div
        className={`
          pointer-events-auto w-full max-w-md
          bg-gradient-to-r ${gradient}
          backdrop-blur-sm
          border border-border ${accent} border-l-4
          rounded shadow-xl
          transition-all duration-300 ease-out
          ${isExiting ? 'animate-out slide-out-to-top-2 fade-out' : 'animate-in slide-in-from-top-2 fade-in'}
        `}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-start gap-4 p-4">
          <div
            className={`
              flex h-10 w-10 shrink-0 items-center justify-center 
              rounded ${iconBg}
              shadow-sm
              transition-transform duration-200
              hover:scale-110
            `}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className={`text-xs font-medium uppercase tracking-wider ${labelColor} mb-2`}>
              {message.type === 'success' && 'Suksess'}
              {message.type === 'error' && 'Feil'}
              {message.type === 'info' && 'Informasjon'}
              {message.type === 'warning' && 'Advarsel'}
            </p>
            <p className={`text-base font-semibold ${textColor} leading-relaxed`}>{message.text}</p>
          </div>

          <button
            onClick={handleClose}
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded
              text-muted-foreground hover:text-foreground
              hover:bg-background/50
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              active:scale-95
            "
            aria-label="Lukk melding"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={`h-1 ${iconBg} rounded-b transition-all duration-[5000ms] ease-linear ${isExiting ? 'w-0' : 'w-full'}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

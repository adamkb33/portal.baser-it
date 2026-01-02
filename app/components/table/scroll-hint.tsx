// components/table/scroll-hint.tsx
import * as React from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type ScrollHintProps = {
  show: boolean;
  onDismiss: () => void;
  className?: string;
};

export function ScrollHint({ show, onDismiss, className }: ScrollHintProps) {
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute left-1/2 bottom-4 z-50 w-auto max-w-md -translate-x-1/2 animate-in fade-in slide-in-from-top-2',
        className,
      )}
    >
      <Alert className="border-border bg-background shadow-lg">
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2 text-sm">Scroll ned for å se alle.</AlertDescription>
      </Alert>
    </div>
  );
}

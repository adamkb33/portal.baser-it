import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export interface ScrollHintProps extends React.HTMLAttributes<HTMLDivElement> {
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function ScrollHint({ containerRef, className, ...props }: ScrollHintProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const target = containerRef?.current;
    if (!target) return;

    const update = () => {
      setVisible(target.scrollTop + target.clientHeight < target.scrollHeight - 4);
    };

    update();
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [containerRef]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'absolute bottom-4 left-1/2 z-20 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface transition-opacity',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        className,
      )}
      {...props}
    >
      <ChevronDown className="h-5 w-5" />
    </div>
  );
}

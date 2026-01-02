import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '~/lib/utils';

function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  const listRef = React.useRef<HTMLOListElement>(null);

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollLeft = listRef.current.scrollWidth;
    }
  }, []);

  return (
    <ol
      ref={listRef}
      data-slot="breadcrumb-list"
      className={cn(
        'flex items-center gap-2 text-sm',
        'overflow-x-auto scrollbar-hide',
        'snap-x snap-mandatory',
        'scroll-smooth',
        '-mx-2 px-2',
        'md:flex-wrap md:overflow-visible md:mx-0 md:px-0',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex items-center gap-2 shrink-0 snap-start', className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : 'a';

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        'text-muted-foreground hover:text-primary transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        'rounded px-2 py-1 min-h-[44px] flex items-center',
        'active:bg-accent/10',
        'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        'text-foreground font-semibold',
        'px-2 py-1 min-h-[44px] flex items-center',
        'whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:h-4 [&>svg]:w-4 text-muted-foreground/50 shrink-0', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        'flex h-11 w-11 items-center justify-center shrink-0',
        'text-muted-foreground hover:text-primary active:text-primary transition-colors duration-200',
        'rounded hover:bg-accent/10 active:bg-accent/20',
        className,
      )}
      {...props}
    >
      <MoreHorizontal className="h-5 w-5" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};

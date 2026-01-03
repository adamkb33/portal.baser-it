// components/auth/auth-form-container.tsx
import * as React from 'react';
import { Link } from 'react-router';

interface AuthFormContainerProps {
  /** Main heading text */
  title: string;
  /** Subheading/description text */
  description: string;
  /** Optional error message to display */
  error?: string | null;
  /** Main form content */
  children: React.ReactNode;
  /** Optional secondary action area (below form) */
  secondaryAction?: React.ReactNode;
  /** Footer link configuration */
  footerLink?: {
    to: string;
    label: string;
  };
}

export function AuthFormContainer({
  title,
  description,
  error,
  children,
  secondaryAction,
  footerLink = { to: '/', label: 'Tilbake til hovedsiden' },
}: AuthFormContainerProps) {
  return (
    <div className="relative p-2 sm:py-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <div className="relative border-2 border-border bg-background">
          <div className="space-y-5 border-b-2 border-border bg-muted p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="relative h-12 w-12 border-2 border-foreground bg-background sm:h-14 sm:w-14">
                  <div className="absolute -bottom-1 -right-1 h-full w-full border border-border" aria-hidden="true" />
                </div>
              </div>
              <div className="flex-1 space-y-2 pt-1">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
                <div className="h-1 w-20 bg-primary" aria-hidden="true" />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
          </div>

          {error && (
            <div className="border-b-2 border-destructive bg-destructive/5">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className="flex-shrink-0">
                  <div className="relative mt-0.5 h-5 w-5 border-2 border-destructive">
                    <div className="absolute left-1/2 top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-destructive" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Feil oppstod</p>
                  <p className="text-sm leading-snug text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="space-y-6">{children}</div>

            {secondaryAction && <div className="mt-8 space-y-4 border-t border-border pt-6">{secondaryAction}</div>}
          </div>

          <div className="border-t-2 border-border bg-muted/50">
            <div className="p-5">
              <Link
                to={footerLink.to}
                className="group flex items-center justify-center gap-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div
                  className="h-1.5 w-1.5 border border-current transition-transform group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                <span className="uppercase tracking-wide">{footerLink.label}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// components/auth/auth-form-container.tsx
import * as React from 'react';
import { Link } from 'react-router';

interface AuthFormContainerProps {
  title: string;
  description: string;
  error?: string | null;
  children: React.ReactNode;
  secondaryAction?: React.ReactNode;
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
    <div className="mx-auto w-full max-w-md">
      <div className="border rounded-md border-form-border">
        {/* Header */}
        <div className="space-y-3 p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-form-text sm:text-3xl">{title}</h1>
          <p className="text-sm text-form-text-muted sm:text-base">{description}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-t border-form-invalid bg-form-invalid/5 px-6 py-4">
            <p className="text-sm text-form-invalid">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="border-t border-form-border p-6 sm:p-8 space-y-4">{children}</div>

        {/* Secondary Action */}
        {secondaryAction && <div className="border-t border-form-border p-6 sm:p-8">{secondaryAction}</div>}

        {/* Footer */}
        <div className="border-t border-form-border bg-form-accent/30 p-4">
          <Link
            to={footerLink.to}
            className="block text-center text-sm text-form-text-muted transition-colors hover:text-form-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring"
          >
            {footerLink.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

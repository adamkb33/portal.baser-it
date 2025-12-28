// components/auth/auth-form-button.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';

interface AuthFormButtonProps {
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function AuthFormButton({
  type = 'submit',
  disabled = false,
  isLoading = false,
  children,
  loadingText,
}: AuthFormButtonProps) {
  return (
    <div className="pt-2">
      <Button
        type={type}
        className="relative w-full border-2 border-border bg-foreground px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-background transition-transform hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50"
        disabled={disabled || isLoading}
      >
        <span className="relative z-10">{isLoading && loadingText ? loadingText : children}</span>
      </Button>
    </div>
  );
}

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
    <Button className="w-full" type={type} disabled={disabled || isLoading}>
      <span className="relative z-10">{isLoading && loadingText ? loadingText : children}</span>
    </Button>
  );
}

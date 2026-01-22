// components/auth/auth-form-button.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<typeof Button>;

interface AuthFormButtonProps extends Omit<ButtonProps, 'children' | 'type' | 'disabled'> {
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
  ...buttonProps
}: AuthFormButtonProps) {
  return (
    <Button className="w-full" type={type} disabled={disabled || isLoading} {...buttonProps}>
      <span className="relative z-10">{isLoading && loadingText ? loadingText : children}</span>
    </Button>
  );
}

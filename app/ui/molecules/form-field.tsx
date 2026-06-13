import * as React from 'react';
import { cn } from '../lib/cn';
import { Input } from '../atoms/input';
import { Label } from '../atoms/label';
import { Text } from '../atoms/text';
import type { InputProps } from '../atoms/input';
import type { LabelProps } from '../atoms/label';

export interface FormFieldProps extends Omit<InputProps, 'id'> {
  id?: string;
  label?: string;
  error?: string;
  labelProps?: Omit<LabelProps, 'htmlFor' | 'children'>;
  helperText?: string;
}

/**
 * FormField: A labeled input with optional error and helper text.
 * Single function: validate and display a text input with contextual information.
 */
export function FormField({
  label,
  error,
  helperText,
  labelProps,
  id,
  className,
  ...inputProps
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const descriptionId = error ? `${fieldId}-error` : helperText ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={fieldId} {...labelProps}>
          {label}
        </Label>
      )}
      <Input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        className={cn(error && 'border-danger', className)}
        {...inputProps}
      />
      {error && (
        <Text id={descriptionId} variant="caption" as="p" className="text-danger">
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text id={descriptionId} variant="caption" as="p" className="text-text-secondary">
          {helperText}
        </Text>
      )}
    </div>
  );
}

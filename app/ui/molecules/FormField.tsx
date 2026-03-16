import { cn } from '../lib/cn';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Text } from '../atoms/Text';
import type { InputProps } from '../atoms/Input';
import type { LabelProps } from '../atoms/Label';

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
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={fieldId} {...labelProps}>
          {label}
        </Label>
      )}
      <Input id={fieldId} className={cn(error && 'border-red-500', className)} {...inputProps} />
      {error && (
        <Text variant="caption" className="text-red-600">
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text variant="caption" className="text-text-secondary">
          {helperText}
        </Text>
      )}
    </div>
  );
}

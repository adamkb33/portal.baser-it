import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import * as React from 'react';

export interface FormField<T> {
  name: keyof T;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'time' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string | number }[]; // For select fields
  className?: string;

  /** Optional field-level error (overrides `errors` prop for this field) */
  error?: string;
  /** Optional helper/description text under the field (above the error if both shown) */
  description?: string;
}

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  type?: 'button' | 'submit';
  className?: string;
}

interface FormDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FormField<T>[];
  formData: T;
  onFieldChange: (name: keyof T, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  actions?: DialogAction[];

  /** Optional central errors map (per field). Example: { givenName: 'Påkrevd' } */
  errors?: Partial<Record<keyof T, string>>;
}

export function FormDialog<T>({
  open,
  onOpenChange,
  title,
  fields,
  formData,
  onFieldChange,
  onSubmit,
  actions,
  errors,
}: FormDialogProps<T>) {
  const renderField = (field: FormField<T>) => {
    const value = (formData as any)[field.name];
    const fieldId = String(field.name);
    const fieldError = field.error ?? errors?.[field.name];
    const ariaInvalid = Boolean(fieldError) ? true : undefined;
    const describedById = fieldError || field.description ? `${fieldId}-desc` : undefined;

    if (field.type === 'select' && field.options) {
      return (
        <div>
          <Select
            value={value != null ? String(value) : ''}
            onValueChange={(val) => onFieldChange(field.name, val)}
            disabled={field.disabled}
          >
            <SelectTrigger id={fieldId} aria-invalid={ariaInvalid} aria-describedby={describedById}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <p id={`${fieldId}-desc`} className="mt-1 text-xs text-muted-foreground">
              {field.description}
            </p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div>
          <Textarea
            id={fieldId}
            aria-invalid={ariaInvalid}
            aria-describedby={describedById}
            value={String(value ?? '')}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            className={field.className}
          />
          {field.description && (
            <p id={`${fieldId}-desc`} className="mt-1 text-xs text-muted-foreground">
              {field.description}
            </p>
          )}
          {fieldError && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        <Input
          id={fieldId}
          aria-invalid={ariaInvalid}
          aria-describedby={describedById}
          type={field.type || 'text'}
          value={String(value ?? '')}
          onChange={(e) => onFieldChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled}
          className={field.className}
        />
        {field.description && (
          <p id={`${fieldId}-desc`} className="mt-1 text-xs text-muted-foreground">
            {field.description}
          </p>
        )}
        {fieldError && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {fieldError}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={String(field.name)}>
              <Label htmlFor={String(field.name)}>{field.label}</Label>
              {renderField(field)}
            </div>
          ))}
          {actions && actions.length > 0 && (
            <div className="flex justify-end gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type || 'button'}
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className={action.className}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

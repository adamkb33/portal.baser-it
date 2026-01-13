import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import * as React from 'react';

export interface FormFieldRenderProps<T> {
  value: any;
  onChange: (value: any) => void;
  field: FormField<T>;
  error?: string;
}

export interface FormField<T> {
  name: keyof T;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'time' | 'date' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  className?: string;
  error?: string;
  description?: string;

  // Mobile optimization
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search' | 'url';
  autoComplete?: string;

  // File-specific
  accept?: string;
  multiple?: boolean;

  // Custom renderer
  render?: (props: FormFieldRenderProps<T>) => React.ReactNode;
}

export interface DialogAction {
  label: string;
  onClick?: () => void;
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

    const handleValueChange = (val: any) => {
      onFieldChange(field.name, val);
    };

    // Custom renderer
    if (field.render) {
      return (
        <div>
          {field.render({
            value,
            onChange: handleValueChange,
            field,
            error: fieldError,
          })}
          {field.description && (
            <p id={`${fieldId}-desc`} className="mt-1.5 text-xs text-form-text-muted sm:text-sm">
              {field.description}
            </p>
          )}
          {fieldError && (
            <p className="mt-1.5 text-xs text-form-invalid sm:text-sm" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // Select
    if (field.type === 'select' && field.options) {
      return (
        <div>
          <Select
            value={value != null ? String(value) : ''}
            onValueChange={(val) => handleValueChange(val)}
            disabled={field.disabled}
          >
            <SelectTrigger
              id={fieldId}
              aria-invalid={ariaInvalid}
              aria-describedby={describedById}
              className="h-12 text-base bg-form-bg border-form-border text-form-text sm:h-11 sm:text-base"
            >
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
            <p id={`${fieldId}-desc`} className="mt-1.5 text-xs text-form-text-muted sm:text-sm">
              {field.description}
            </p>
          )}
          {fieldError && (
            <p className="mt-1.5 text-xs text-form-invalid sm:text-sm" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // Textarea
    if (field.type === 'textarea') {
      return (
        <div>
          <Textarea
            id={fieldId}
            aria-invalid={ariaInvalid}
            aria-describedby={describedById}
            value={String(value ?? '')}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            className={`min-h-24 px-3 py-3 text-base bg-form-bg border-form-border text-form-text sm:min-h-28 ${field.className || ''}`}
          />
          {field.description && (
            <p id={`${fieldId}-desc`} className="mt-1.5 text-xs text-form-text-muted sm:text-sm">
              {field.description}
            </p>
          )}
          {fieldError && (
            <p className="mt-1.5 text-xs text-form-invalid sm:text-sm" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // File
    if (field.type === 'file') {
      return (
        <div>
          <Input
            id={fieldId}
            type="file"
            aria-invalid={ariaInvalid}
            aria-describedby={describedById}
            required={field.required}
            disabled={field.disabled}
            accept={field.accept}
            multiple={field.multiple}
            className={`h-12 text-base bg-form-bg border-form-border sm:h-11 ${field.className || ''}`}
            onChange={(e) => {
              const files = e.target.files;
              if (!files) {
                handleValueChange(field.multiple ? [] : null);
                return;
              }
              handleValueChange(field.multiple ? Array.from(files) : (files[0] ?? null));
            }}
          />
          {field.description && (
            <p id={`${fieldId}-desc`} className="mt-1.5 text-xs text-form-text-muted sm:text-sm">
              {field.description}
            </p>
          )}
          {fieldError && (
            <p className="mt-1.5 text-xs text-form-invalid sm:text-sm" role="alert">
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // Default input
    return (
      <div>
        <Input
          id={fieldId}
          aria-invalid={ariaInvalid}
          aria-describedby={describedById}
          type={field.type || 'text'}
          inputMode={field.inputMode}
          autoComplete={field.autoComplete}
          value={String(value ?? '')}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled}
          className={`h-12 px-3 text-base bg-form-bg border-form-border text-form-text sm:h-11 sm:px-4 ${field.className || ''}`}
        />
        {field.description && (
          <p id={`${fieldId}-desc`} className="mt-1.5 text-xs text-form-text-muted sm:text-sm">
            {field.description}
          </p>
        )}
        {fieldError && (
          <p className="mt-1.5 text-xs text-form-invalid sm:text-sm" role="alert">
            {fieldError}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] w-full p-0 sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg sm:p-6">
        <DialogHeader className="border-b border-border p-4 sm:border-b-0 sm:p-0 sm:pb-4">
          <DialogTitle className="text-lg font-semibold text-foreground sm:text-xl">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col" encType="multipart/form-data">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-0">
            <div className="space-y-4 sm:space-y-5">
              {fields.map((field) => (
                <div key={String(field.name)} className="space-y-1.5">
                  <Label htmlFor={String(field.name)} className="text-sm font-medium text-foreground sm:text-base">
                    {field.label}
                    {field.required && <span className="ml-1 text-form-invalid">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>

          {/* Sticky footer on mobile */}
          {actions && actions.length > 0 && (
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-background p-4 sm:static sm:flex-row sm:justify-end sm:gap-3 sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-6">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  type={action.type || 'button'}
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className={`w-full py-3 text-sm sm:w-auto sm:px-6 sm:py-3 sm:text-base ${action.className || ''}`}
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

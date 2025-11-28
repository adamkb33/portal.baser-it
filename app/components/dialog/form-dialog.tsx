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
  type?: 'text' | 'email' | 'password' | 'number' | 'time' | 'date' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  className?: string;
  error?: string;
  description?: string;

  // file-specific
  accept?: string; // e.g. "image/*,.pdf"
  multiple?: boolean; // allow multi file selection

  // custom renderer (Option A)
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

    // ✅ Custom renderer takes full control of the input
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
            <p
              id={`${fieldId}-desc`}
              className={[
                'mt-1', // spacing
                'text-[0.7rem]', // typography
                'text-muted-foreground', // color
              ].join(' ')}
            >
              {field.description}
            </p>
          )}
          {fieldError && (
            <p
              className={[
                'mt-1', // spacing
                'text-xs', // typography
                'text-destructive', // color
              ].join(' ')}
              role="alert"
            >
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // select
    if (field.type === 'select' && field.options) {
      return (
        <div>
          <Select
            value={value != null ? String(value) : ''}
            onValueChange={(val) => handleValueChange(val)}
            disabled={field.disabled}
          >
            <SelectTrigger id={fieldId} aria-invalid={ariaInvalid} aria-describedby={describedById} className="mt-1">
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
            <p
              id={`${fieldId}-desc`}
              className={[
                'mt-1', // spacing
                'text-[0.7rem]', // typography
                'text-muted-foreground', // color
              ].join(' ')}
            >
              {field.description}
            </p>
          )}
          {fieldError && (
            <p
              className={[
                'mt-1', // spacing
                'text-xs', // typography
                'text-destructive', // color
              ].join(' ')}
              role="alert"
            >
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // textarea
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
            className={field.className ? `mt-1 ${field.className}` : 'mt-1'}
          />
          {field.description && (
            <p
              id={`${fieldId}-desc`}
              className={[
                'mt-1', // spacing
                'text-[0.7rem]', // typography
                'text-muted-foreground', // color
              ].join(' ')}
            >
              {field.description}
            </p>
          )}
          {fieldError && (
            <p
              className={[
                'mt-1', // spacing
                'text-xs', // typography
                'text-destructive', // color
              ].join(' ')}
              role="alert"
            >
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // file
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
            className={field.className ? `mt-1 ${field.className}` : 'mt-1'}
            onChange={(e) => {
              const files = e.target.files;

              if (!files) {
                handleValueChange(field.multiple ? [] : null);
                return;
              }

              if (field.multiple) {
                handleValueChange(Array.from(files)); // File[]
              } else {
                handleValueChange(files[0] ?? null); // File | null
              }
            }}
          />
          {field.description && (
            <p
              id={`${fieldId}-desc`}
              className={[
                'mt-1', // spacing
                'text-[0.7rem]', // typography
                'text-muted-foreground', // color
              ].join(' ')}
            >
              {field.description}
            </p>
          )}
          {fieldError && (
            <p
              className={[
                'mt-1', // spacing
                'text-xs', // typography
                'text-destructive', // color
              ].join(' ')}
              role="alert"
            >
              {fieldError}
            </p>
          )}
        </div>
      );
    }

    // default input
    return (
      <div>
        <Input
          id={fieldId}
          aria-invalid={ariaInvalid}
          aria-describedby={describedById}
          type={field.type || 'text'}
          value={String(value ?? '')}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={field.disabled}
          className={field.className ? `mt-1 ${field.className}` : 'mt-1'}
        />
        {field.description && (
          <p
            id={`${fieldId}-desc`}
            className={[
              'mt-1', // spacing
              'text-[0.7rem]', // typography
              'text-muted-foreground', // color
            ].join(' ')}
          >
            {field.description}
          </p>
        )}
        {fieldError && (
          <p
            className={[
              'mt-1', // spacing
              'text-xs', // typography
              'text-destructive', // color
            ].join(' ')}
            role="alert"
          >
            {fieldError}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={[
          // G. Dialog / Overlay Content (ATOMIC) - Dialog container
          'max-w-3xl', // sizing
          'rounded-none', // brutalist: sharp corners
          'border border-border', // visual tokens
          'bg-background', // visual tokens
          'px-4 py-5 sm:px-6 sm:py-6', // spacing
        ].join(' ')}
      >
        <DialogHeader
          className={[
            // G. Dialog / Overlay Content (ATOMIC) - Dialog header
            'mb-3', // spacing
            'border-b border-border', // visual tokens
            'pb-3', // spacing
          ].join(' ')}
        >
          <DialogTitle
            className={[
              // G. Dialog / Overlay Content (ATOMIC) - Dialog title
              'text-sm', // typography
              'font-medium', // typography
              'text-foreground', // color
            ].join(' ')}
          >
            {title}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className={[
            // A. Containers - Primary block container
            'space-y-5', // spacing
            'pt-1', // spacing adjustment
          ].join(' ')}
          encType="multipart/form-data" // important for file uploads
        >
          <div
            className={[
              // D. Layout / Stacking (ATOMIC) - Vertical stack
              'flex flex-col', // layout
              'gap-4', // spacing
            ].join(' ')}
          >
            {fields.map((field) => (
              <div
                key={String(field.name)}
                className={[
                  // D. Layout / Stacking (ATOMIC) - Vertical stack
                  'flex flex-col', // layout
                  'gap-1.5', // spacing
                ].join(' ')}
              >
                <Label
                  htmlFor={String(field.name)}
                  className={[
                    // B. Typography Hierarchy (ATOMIC) - Section label / meta heading
                    'text-xs', // typography
                    'font-medium', // typography
                    'uppercase', // typography
                    'tracking-[0.12em]', // typography
                    'text-muted-foreground', // color
                  ].join(' ')}
                >
                  {field.label}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {actions && actions.length > 0 && (
            <div
              className={[
                // A. Containers - Sub-section divider inside a block
                'mt-4', // spacing
                'flex items-center justify-end', // layout
                'gap-2', // spacing
                'border-t border-border', // visual tokens
                'pt-4', // spacing
              ].join(' ')}
            >
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

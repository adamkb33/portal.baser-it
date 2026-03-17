import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import {
  type SubmitContactFormSchema,
  submitContactFormSchema,
} from '~/routes/booking/public/appointment/session/contact/_schemas/submit-contact.form.schema';
import { Button, Input, Label, Text } from '~/ui';

export interface GetOrCreateContactFetcherFormProps {
  companyId: number;
  onSubmit: (values: SubmitContactFormSchema) => void;
  onChange?: () => void;
  onValidityChange?: (isValid: boolean) => void;
  initialValues?: Partial<SubmitContactFormSchema>;
  isSubmitting?: boolean;
  formId?: string;
}

export function SubmitContactForm({
  companyId,
  onSubmit,
  onChange,
  onValidityChange,
  initialValues,
  isSubmitting = false,
  formId = 'booking-contact-form',
}: GetOrCreateContactFetcherFormProps) {
  const form = useForm<SubmitContactFormSchema>({
    resolver: zodResolver(submitContactFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      companyId,
      givenName: '',
      familyName: '',
      email: '',
      mobileNumber: '',
      ...initialValues,
    },
  });

  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch(() => {
      onChange();
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  React.useEffect(() => {
    if (!onValidityChange) return;
    onValidityChange(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  const renderField = (
    name: keyof SubmitContactFormSchema,
    label: string,
    options?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  ) => {
    const fieldError = form.formState.errors[name];
    const field = form.register(name);

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          {...field}
          {...options}
          aria-invalid={Boolean(fieldError)}
        />
        {fieldError?.message ? (
          <Text as="p" variant="caption" className="text-destructive">
            {String(fieldError.message)}
          </Text>
        ) : null}
      </div>
    );
  };

  return (
    <form id={formId} className="flex flex-col" onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 md:space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {renderField('givenName', 'Fornavn', {
            autoComplete: 'given-name',
          })}
          {renderField('familyName', 'Etternavn', {
            autoComplete: 'family-name',
          })}
        </div>

        {renderField('email', 'E-post', {
          type: 'email',
          inputMode: 'email',
          autoComplete: 'email',
        })}

        {renderField('mobileNumber', 'Mobilnummer', {
          type: 'tel',
          inputMode: 'tel',
          autoComplete: 'tel',
          maxLength: 8,
        })}
      </div>

      <div className="mt-6 hidden md:block">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Lagrer…
            </>
          ) : (
            'Fortsett'
          )}
        </Button>
      </div>
    </form>
  );
}

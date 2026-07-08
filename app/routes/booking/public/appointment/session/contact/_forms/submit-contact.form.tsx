import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  type SubmitContactFormInput,
  type SubmitContactFormSchema,
  submitContactFormSchema,
} from '~/routes/booking/public/appointment/session/contact/_schemas/submit-contact.form.schema';
import { Button, Input, Label, Text } from '~/ui';
import { BOOKING_CONTACT_LABEL_CLASS } from '../_utils/booking-contact-theme';

export interface GetOrCreateContactFetcherFormProps {
  companyId: number;
  onSubmit: (values: SubmitContactFormSchema) => void;
  onChange?: () => void;
  onValidityChange?: (isValid: boolean) => void;
  initialValues?: Partial<SubmitContactFormInput>;
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
  const form = useForm<SubmitContactFormInput, unknown, SubmitContactFormSchema>({
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
    name: keyof SubmitContactFormInput,
    label: string,
    options?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & { helperText?: string },
  ) => {
    const fieldError = form.formState.errors[name];
    const field = form.register(name);
    const { helperText, ...inputOptions } = options ?? {};

    return (
      <div className="space-y-2">
        <Label htmlFor={name} className={BOOKING_CONTACT_LABEL_CLASS}>
          {label}
        </Label>
        <Input
          id={name}
          {...field}
          {...inputOptions}
          aria-invalid={Boolean(fieldError)}
          disabled={isSubmitting || inputOptions.disabled}
          invalid={Boolean(fieldError)}
          variant="booking"
        />
        {helperText ? (
          <Text as="p" variant="caption" className="text-booking-text-muted">
            {helperText}
          </Text>
        ) : null}
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
          helperText: 'Valgfritt. Legg inn e-post hvis du også vil motta bekreftelse på e-post.',
        })}

        {renderField('mobileNumber', 'Mobilnummer', {
          type: 'tel',
          inputMode: 'tel',
          autoComplete: 'tel',
          maxLength: 8,
          required: true,
          helperText: 'Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.',
        })}
      </div>

      <div className="mt-6 hidden md:block">
        <Button type="submit" variant="booking-primary" loading={isSubmitting}>
          {isSubmitting ? 'Lagrer...' : 'Fortsett'}
        </Button>
      </div>
    </form>
  );
}

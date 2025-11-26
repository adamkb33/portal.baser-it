import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
  type GetOrCreateContactSchema,
  getOrCreateContactSchema,
} from '~/features/booking/get-or-create-contact.schema';

export interface GetOrCreateContactFetcherFormProps {
  companyId: number;
  /** Called with parsed Zod data after submit succeeds (HTTP 2xx). */
  onSuccess?: (values: GetOrCreateContactSchema) => void;
  /** Optional callback whenever any field changes. */
  onChange?: () => void;
  /** Optional initial values (e.g. from loader). */
  initialValues?: Partial<GetOrCreateContactSchema>;
  /** Optional action URL (defaults to current route). */
  action?: string;
  /** Optional HTTP method (defaults to "post"). */
  method?: 'post' | 'put' | 'patch';
}

/**
 * Brutalist-themed contact form using:
 * - zod + react-hook-form for validation
 * - shadcn Form / Input / Button
 * - React Router v7 useFetcher for submission
 */
export function GetOrCreateContactFetcherForm({
  companyId,
  onSuccess,
  onChange,
  initialValues,
  action,
  method = 'post',
}: GetOrCreateContactFetcherFormProps) {
  const fetcher = useFetcher({ key: 'appointment-contact-form-fetcher' });

  const form = useForm<GetOrCreateContactSchema>({
    resolver: zodResolver(getOrCreateContactSchema),
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
    if (!initialValues) return;

    form.reset({
      companyId,
      givenName: initialValues.givenName ?? '',
      familyName: initialValues.familyName ?? '',
      email: initialValues.email ?? '',
      mobileNumber: initialValues.mobileNumber ?? '',
    });
  }, [initialValues, form, companyId]);

  // Notify parent when any field changes
  React.useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch(() => {
      onChange();
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';

  const handleSubmit = form.handleSubmit((values) => {
    // Submit via fetcher as FormData to hit the route action
    const formData = new FormData();
    formData.set('companyId', String(values.companyId));
    formData.set('givenName', values.givenName);
    formData.set('familyName', values.familyName);
    if (values.email) formData.set('email', values.email);
    if (values.mobileNumber) formData.set('mobileNumber', values.mobileNumber);

    fetcher.submit(formData, {
      method,
      action,
    });

    onSuccess?.(values);
  });

  return (
    <Form {...form}>
      <fetcher.Form
        method={method}
        action={action}
        // brutalist layout: vertical stack, tight gaps
        className="flex flex-col gap-3 bg-white"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Hidden company id (still submitted for progressive enhancement) */}
        <input type="hidden" name="companyId" value={companyId} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <FormField
            control={form.control}
            name="givenName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs font-medium text-foreground">Fornavn</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="given-name"
                    className="h-9 rounded-none border border-border bg-background text-sm"
                  />
                </FormControl>
                <FormMessage className="text-[0.7rem]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="familyName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs font-medium text-foreground">Etternavn</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="family-name"
                    className="h-9 rounded-none border border-border bg-background text-sm"
                  />
                </FormControl>
                <FormMessage className="text-[0.7rem]" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-foreground">E-post</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  className="h-9 rounded-none border border-border bg-background text-sm"
                />
              </FormControl>
              <FormMessage className="text-[0.7rem]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-foreground">Mobilnummer</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  autoComplete="tel"
                  maxLength={8}
                  className="h-9 rounded-none border border-border bg-background text-sm"
                />
              </FormControl>
              <FormMessage className="text-[0.7rem]" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="h-9 w-full rounded-none border border-border bg-foreground text-sm text-background"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Lagrer…' : 'Fortsett'}
        </Button>
      </fetcher.Form>
    </Form>
  );
}

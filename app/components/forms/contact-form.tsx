import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
  type GetCreateOrUpdateContactSchema,
  getCreateOrUpdateContactSchema,
} from '~/features/booking/get-or-create-contact.schema';

export interface GetOrCreateContactFetcherFormProps {
  companyId: number;
  onSuccess?: (values: GetCreateOrUpdateContactSchema) => void;
  onChange?: () => void;
  initialValues?: Partial<GetCreateOrUpdateContactSchema>;
  action?: string;
  method?: 'post' | 'put' | 'patch';
}

export function GetOrCreateContactFetcherForm({
  companyId,
  onSuccess,
  onChange,
  initialValues,
  action,
  method = 'post',
}: GetOrCreateContactFetcherFormProps) {
  console.log(initialValues);
  const fetcher = useFetcher({ key: 'appointment-contact-form-fetcher' });

  const form = useForm<GetCreateOrUpdateContactSchema>({
    resolver: zodResolver(getCreateOrUpdateContactSchema),
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

  const isSubmitting = fetcher.state === 'submitting' || fetcher.state === 'loading';

  const handleSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.set('id', String(values.id));
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
        className="flex flex-col gap-3 bg-white"
        onSubmit={handleSubmit}
        noValidate
      >
        {initialValues && initialValues.id && <input type="hidden" name="id" value={initialValues.id} />}
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

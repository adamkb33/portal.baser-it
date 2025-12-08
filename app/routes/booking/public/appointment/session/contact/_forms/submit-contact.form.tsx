import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
  type SubmitContactFormSchema,
  submitContactFormSchema,
} from '~/routes/booking/public/appointment/session/contact/_schemas/submit-contact.form.schema';

export interface GetOrCreateContactFetcherFormProps {
  companyId: number;
  onSubmit: (values: SubmitContactFormSchema) => void;
  onChange?: () => void;
  initialValues?: Partial<SubmitContactFormSchema>;
  isSubmitting?: boolean;
}

export function SubmitContactForm({
  companyId,
  onSubmit,
  onChange,
  initialValues,
  isSubmitting = false,
}: GetOrCreateContactFetcherFormProps) {
  const form = useForm<SubmitContactFormSchema>({
    resolver: zodResolver(submitContactFormSchema),
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

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <Form {...form}>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
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

        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Lagrer…' : 'Fortsett'}
        </Button>
      </form>
    </Form>
  );
}

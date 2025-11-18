import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  type GetOrCreateContactSchema,
  getOrCreateContactSchema,
} from '~/features/booking/get-or-create-contact.schema';

export interface GetOrCreateContactFormProps {
  companyId: number;
  onSubmit: (values: GetOrCreateContactSchema) => void;
  onChange?: () => void;
  isSubmitting?: boolean;
  initialValues?: Partial<GetOrCreateContactSchema>;
}

export function GetOrCreateContactForm({
  companyId,
  onSubmit,
  onChange,
  isSubmitting = false,
  initialValues,
}: GetOrCreateContactFormProps) {
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
    if (initialValues) {
      form.reset({
        companyId,
        givenName: initialValues.givenName ?? '',
        familyName: initialValues.familyName ?? '',
        email: initialValues.email ?? '',
        mobileNumber: initialValues.mobileNumber ?? '',
      });
    }
  }, [initialValues, form, companyId]);

  React.useEffect(() => {
    const subscription = form.watch(() => {
      onChange?.();
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <Form {...form}>
      <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <input hidden name="companyId" value={companyId} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <FormField
            control={form.control}
            name="givenName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">Fornavn</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="given-name" className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="familyName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">Etternavn</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="family-name" className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">E-post</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" className="h-9" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Mobilnummer</FormLabel>
              <FormControl>
                <Input {...field} type="tel" autoComplete="tel" maxLength={8} className="h-9" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-9 text-sm" disabled={isSubmitting}>
          {isSubmitting ? 'Lagrer...' : 'Fortsett'}
        </Button>
      </form>
    </Form>
  );
}

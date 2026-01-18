import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

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
  formId?: string;
}

export function SubmitContactForm({
  companyId,
  onSubmit,
  onChange,
  initialValues,
  isSubmitting = false,
  formId = 'booking-contact-form',
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
      <form id={formId} className="flex flex-col" onSubmit={handleSubmit} noValidate>
        {/* Form Fields Container - Mobile-first spacing */}
        <div className="space-y-4 md:space-y-5">
          {/* Name Fields - Single column mobile, side-by-side desktop */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <FormField
              control={form.control}
              name="givenName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-form-text md:text-base">Fornavn</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="given-name"
                      placeholder="Ola"
                      className="h-12 bg-form-bg border-form-border text-base placeholder:text-form-text-muted focus:border-form-ring focus:ring-form-ring md:h-11"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-form-invalid md:text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="familyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-form-text md:text-base">Etternavn</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      placeholder="Nordmann"
                      className="h-12 bg-form-bg border-form-border text-base placeholder:text-form-text-muted focus:border-form-ring focus:ring-form-ring md:h-11"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-form-invalid md:text-sm" />
                </FormItem>
              )}
            />
          </div>

          {/* Email - Full width always */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-form-text md:text-base">E-post</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="ola.nordmann@example.com"
                    className="h-12 bg-form-bg border-form-border text-base placeholder:text-form-text-muted focus:border-form-ring focus:ring-form-ring md:h-11"
                  />
                </FormControl>
                <FormMessage className="text-xs text-form-invalid md:text-sm" />
              </FormItem>
            )}
          />

          {/* Mobile Number - Full width always */}
          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-form-text md:text-base">Mobilnummer</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={8}
                    placeholder="12345678"
                    className="h-12 bg-form-bg border-form-border text-base placeholder:text-form-text-muted focus:border-form-ring focus:ring-form-ring md:h-11"
                  />
                </FormControl>
                <FormMessage className="text-xs text-form-invalid md:text-sm" />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button - Desktop only */}
        <div className="mt-6 hidden md:block">
          <Button
            variant="default"
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 text-sm font-semibold"
          >
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
    </Form>
  );
}

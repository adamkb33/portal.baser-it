import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type AcceptInviteSchema, acceptInviteSchema } from '../schemas/accept-invite.form.schema';

export interface AcceptInviteFormProps {
  inviteToken: string;
  onSubmit: (values: AcceptInviteSchema) => void;
  isSubmitting?: boolean;
  serverError?: string;
  initialValues?: Partial<AcceptInviteSchema>;
}

export function AcceptInviteForm({
  inviteToken,
  onSubmit,
  isSubmitting = false,
  initialValues,
}: AcceptInviteFormProps) {
  const form = useForm<AcceptInviteSchema>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      inviteToken,
      givenName: '',
      familyName: '',
      password: '',
      confirmPassword: '',
      ...initialValues,
    },
  });

  if (form.formState.errors) {
    console.error(form.formState.errors);
  }

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        givenName: initialValues.givenName ?? '',
        familyName: initialValues.familyName ?? '',
        password: initialValues.password ?? '',
        confirmPassword: initialValues.confirmPassword ?? '',
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <input hidden name="inviteToken" value={inviteToken} />

          <FormField
            control={form.control}
            name="givenName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="given-name" data-testid="givenName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="familyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="family-name" data-testid="familyName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" data-testid="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" data-testid="confirmPassword" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resetPasswordSchema, type ResetPasswordSchema } from '~/features/auth/schemas/reset-password.schema';

export interface ResetPasswordFormProps {
  email: string;
  resetPasswordToken: string;
  onSubmit: (values: ResetPasswordSchema) => void;
  isSubmitting?: boolean;
  initialValues?: Partial<ResetPasswordSchema>;
}

export function ResetPasswordForm({
  email,
  resetPasswordToken,
  onSubmit,
  isSubmitting = false,
  initialValues,
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetPasswordToken,
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
        password: initialValues.password ?? '',
        confirmPassword: initialValues.confirmPassword ?? '',
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <input hidden name="resetPasswordToken" value={resetPasswordToken} />

        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="email" data-testid="email" value={email} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

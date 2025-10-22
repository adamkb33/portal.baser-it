import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signInSchema, type SignInSchema } from '~/features/auth/schemas/sign-in.schema';
import { forgotPasswordSchema, type ForgotPasswordSchema } from '~/features/auth/schemas/forgot-password.schema';

export interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordSchema) => void;
  isSubmitting?: boolean;
  initialValues?: Partial<ForgotPasswordSchema>;
}

export function ForgotPasswordForm({ onSubmit, isSubmitting = false, initialValues }: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      ...initialValues,
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        email: initialValues.email ?? '',
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-post</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" placeholder="din@e-post.no" data-testid="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Behandler…' : 'Send kode for tilbakestilling'}
        </Button>
      </form>
    </Form>
  );
}

export { signInSchema };
export type { SignInSchema as SignInInput };

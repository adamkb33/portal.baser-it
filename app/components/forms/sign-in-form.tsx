import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  signInSchema,
  type SignInInput,
} from "@/features/auth/schemas/sign-in";

export interface SignInFormProps {
  onSubmit: (values: SignInInput) => void;
  isSubmitting?: boolean;
  serverError?: string;
  initialValues?: Partial<SignInInput>;
  fieldErrors?: Partial<Record<keyof SignInInput, string | undefined>>;
}

export function SignInForm({
  onSubmit,
  isSubmitting = false,
  serverError,
  initialValues,
  fieldErrors,
}: SignInFormProps) {
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      ...initialValues,
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        email: initialValues.email ?? "",
        password: initialValues.password ?? "",
      });
    }
  }, [initialValues, form]);

  React.useEffect(() => {
    form.clearErrors();
    if (!fieldErrors) {
      return;
    }

    for (const [field, message] of Object.entries(fieldErrors)) {
      if (!message) continue;
      form.setError(field as keyof SignInInput, {
        type: "server",
        message,
      });
    }
  }, [fieldErrors, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  data-testid="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  data-testid="password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing In…" : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}

export { signInSchema };
export type { SignInInput };

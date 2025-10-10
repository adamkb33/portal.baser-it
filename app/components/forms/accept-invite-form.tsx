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
  acceptInviteSchema,
  type AcceptInviteInput,
} from "@/features/auth/schemas/accept-invite";

export interface AcceptInviteFormProps {
  onSubmit: (values: AcceptInviteInput) => void;
  isSubmitting?: boolean;
  serverError?: string;
  fieldErrors?: Partial<Record<keyof AcceptInviteInput, string | undefined>>;
  initialValues?: Partial<AcceptInviteInput>;
}

export function AcceptInviteForm({
  onSubmit,
  isSubmitting = false,
  serverError,
  fieldErrors,
  initialValues,
}: AcceptInviteFormProps) {
  const form = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      givenName: "",
      familyName: "",
      password: "",
      confirmPassword: "",
      ...initialValues,
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        givenName: initialValues.givenName ?? "",
        familyName: initialValues.familyName ?? "",
        password: initialValues.password ?? "",
        confirmPassword: initialValues.confirmPassword ?? "",
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
      form.setError(field as keyof AcceptInviteInput, {
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

        <div className="grid gap-4 sm:grid-cols-2">
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
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  data-testid="password"
                />
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
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  data-testid="confirmPassword"
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}

// ~/components/forms/invite-employee.form.tsx
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Roles } from '~/api/clients/types';
import {
  inviteEmployeeSchema,
  type InviteEmployeeSchema,
} from '~/features/company/admin/schemas/invite-employee.schema';
import { Checkbox } from '@radix-ui/react-checkbox';

export interface InviteEmployeeFormProps {
  onSubmit: (values: InviteEmployeeSchema) => void;
  isSubmitting?: boolean;
  serverError?: string;
  initialValues?: Partial<InviteEmployeeSchema>;
}

export function InviteEmployeeForm({ onSubmit, isSubmitting = false, initialValues }: InviteEmployeeFormProps) {
  const form = useForm<InviteEmployeeSchema>({
    resolver: zodResolver(inviteEmployeeSchema),
    defaultValues: {
      givenName: '',
      familyName: '',
      email: '',
      roles: [],
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
        email: initialValues.email ?? '',
        roles: initialValues.roles ?? [],
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="givenName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornavn</FormLabel>
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
                <FormLabel>Etternavn</FormLabel>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-postadresse</FormLabel>
              <FormControl>
                <Input {...field} type="email" autoComplete="email" data-testid="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="roles"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Roller</FormLabel>
              </div>
              {Object.values(Roles).map((role) => (
                <FormField
                  key={role}
                  control={form.control}
                  name="roles"
                  render={({ field }) => {
                    return (
                      <FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, role])
                                : field.onChange(field.value?.filter((value) => value !== role));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{role}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sender invitasjon…' : 'Send invitasjon'}
        </Button>
      </form>
    </Form>
  );
}

// ~/components/forms/invite-employee.form.tsx
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Roles } from '~/api/clients/types';
import {
  inviteEmployeeSchema,
  type InviteEmployeeSchema,
} from '~/features/company/admin/schemas/invite-employee.schema';

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
      email: '',
      roles: [],
      ...initialValues,
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        email: initialValues.email ?? '',
        roles: initialValues.roles ?? [],
      });
    }
  }, [initialValues, form]);

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
                <FormLabel className="text-base">Roller</FormLabel>
              </div>
              <div className="space-y-3">
                {Object.values(Roles).map((role) => (
                  <FormField
                    key={role}
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), role])
                                : field.onChange(field.value?.filter((value) => value !== role));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">{role}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
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

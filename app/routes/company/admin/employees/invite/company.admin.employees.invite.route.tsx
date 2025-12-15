// app/routes/company/employees/invite/company.employees.invite.route.tsx
import * as React from 'react';
import { useSubmit, useNavigation, Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CompanyRoles, Roles } from '~/api/clients/types';
import { inviteEmployeeSchema, type InviteEmployeeSchema } from './_schemas/invite-employee.schema';
import { inviteEmployee } from './_features/invite-employee.action';
import type { Route } from './+types/company.admin.employees.invite.route';
import { getCompanyRoleLabel } from '~/lib/constants';

export const action = inviteEmployee;

export default function CompanyEmployeesInviteRoute({ actionData }: Route.ComponentProps) {
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const form = useForm<InviteEmployeeSchema>({
    resolver: zodResolver(inviteEmployeeSchema),
    defaultValues: {
      email: '',
      roles: [],
    },
  });

  const handleSubmit = React.useCallback(
    (values: InviteEmployeeSchema) => {
      const formData = new FormData();
      formData.set('email', values.email);
      formData.set('roles', JSON.stringify(values.roles));

      submit(formData, { method: 'post' });
    },
    [submit],
  );

  return (
    <div className="w-full">
      <header className="mb-12 pb-8 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">Inviter medarbeider</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Send en invitasjon til en ny medarbeider for å gi dem tilgang til systemet.
        </p>
      </header>

      {actionData?.error && (
        <div role="alert" className="mb-8 border-2 border-foreground bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground mb-2">Feil</p>
          <p className="text-sm text-foreground">{actionData.error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 flex flex-col" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground mb-2">
                  E-postadresse
                </FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" disabled={isSubmitting} />
                </FormControl>
                <FormMessage className="mt-2 text-xs text-foreground" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roles"
            render={() => (
              <FormItem>
                <fieldset className="border-2 border-border bg-background p-6">
                  <legend className="px-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground">
                    Velg roller
                  </legend>

                  <p className="text-xs text-muted-foreground mt-3 mb-4">Velg én eller flere roller for den ansatte</p>

                  <div className="space-y-3">
                    {Object.values(CompanyRoles).map((role) => (
                      <FormField
                        key={role}
                        control={form.control}
                        name="roles"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role)}
                                disabled={isSubmitting}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), role])
                                    : field.onChange(field.value?.filter((value) => value !== role));
                                }}
                                className="border-2 border-border rounded-none data-[state=checked]:bg-foreground data-[state=checked]:text-background"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal text-foreground cursor-pointer select-none">
                              {getCompanyRoleLabel(role)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <FormMessage className="mt-3 text-xs text-foreground" />
                </fieldset>
              </FormItem>
            )}
          />

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="border-2 border-border bg-foreground text-background px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] rounded-none hover:bg-background hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sender invitasjon…' : 'Send invitasjon'}
            </Button>

            <Link
              to="/company/employees"
              className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Avbryt
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}

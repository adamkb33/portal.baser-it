import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  editCompanyUserSchema,
  type EditCompanyUserSchema,
} from '~/routes/company/employees/edit/_schemas/edit-company-user.form.schema';

export interface EditCompanyUserFormProps {
  email: string;
  initialRoles: Array<'ADMIN' | 'EMPLOYEE'>;
  onSubmit: (values: EditCompanyUserSchema) => void;
  isSubmitting?: boolean;
}

export function EditCompanyUserForm({ email, initialRoles, onSubmit, isSubmitting = false }: EditCompanyUserFormProps) {
  const form = useForm<EditCompanyUserSchema>({
    resolver: zodResolver(editCompanyUserSchema),
    defaultValues: {
      roles: initialRoles,
    },
  });

  const roleOptions: Array<{ value: 'ADMIN' | 'EMPLOYEE'; label: string }> = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'EMPLOYEE', label: 'Ansatt' },
  ];

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            E-post
          </label>
          <div className="rounded-md border px-3 py-2 bg-muted text-muted-foreground">{email}</div>
        </div>

        <FormField
          control={form.control}
          name="roles"
          render={() => (
            <FormItem>
              <FormLabel>Roller</FormLabel>
              <div className="space-y-3">
                {roleOptions.map((role) => (
                  <FormField
                    key={role.value}
                    control={form.control}
                    name="roles"
                    render={({ field }) => {
                      return (
                        <FormItem key={role.value} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(role.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, role.value])
                                  : field.onChange(field.value?.filter((value) => value !== role.value));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{role.label}</FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Lagrer…' : 'Lagre endringer'}
          </Button>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  );
}

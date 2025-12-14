import * as React from 'react';
import { useFetcher } from 'react-router';

import type { InviteEmployeeSchema } from './_schemas/invite-employee.schema';
import { InviteEmployeeForm } from './_forms/invite-employee.form';
import { inviteEmployee } from './_features/invite-employee.action';

export const action = inviteEmployee;

export default function CompanyAdminEmployeesInviteRoute() {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state !== 'idle';
  const actionData = fetcher.data;

  const handleSubmit = React.useCallback(
    (values: InviteEmployeeSchema) => {
      const payload = new FormData();
      payload.set('email', values.email);
      payload.set('roles', JSON.stringify(values.roles));

      fetcher.submit(payload, {
        method: 'post',
        action: '/company/employees/invite',
      });
    },
    [fetcher],
  );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Inviter medarbeider</h1>
        <p className="text-muted-foreground text-sm">
          Send en invitasjon til en ny medarbeider for å gi dem tilgang til systemet.
        </p>
      </header>

      {actionData?.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionData.error}
        </div>
      ) : null}

      <InviteEmployeeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={actionData?.values} />
    </div>
  );
}

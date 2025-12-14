import React from 'react';
import { useFetcher, useLoaderData, useLocation } from 'react-router';

import { editEmployeeLoader, type CompanyEmployeesEditLoaderData } from './_features/edit-employee.loader';
import { editEmployeeAction } from './_features/edit-employee.action';
import { EditCompanyUserForm } from './_forms/edit-company-user.form';
import type { EditCompanyUserSchema } from './_schemas/edit-company-user.form.schema';

export const loader = editEmployeeLoader;
export const action = editEmployeeAction;

export default function CompanyEmployeesEdit() {
  const location = useLocation();
  const fetcher = useFetcher();
  const { user } = useLoaderData<CompanyEmployeesEditLoaderData>();

  const handleSubmit = React.useCallback(
    (values: EditCompanyUserSchema) => {
      const payload = new FormData();
      payload.set('userId', user.userId.toString());
      payload.set('roles', values.roles.toString());

      fetcher.submit(payload, {
        method: 'post',
        action: location.pathname,
      });
    },
    [fetcher, user.userId, location.pathname],
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rediger ansatt</h1>
          <p className="text-muted-foreground">Oppdater roller for ansatt</p>
        </div>

        <EditCompanyUserForm email={user.email} initialRoles={user.roles} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}

// routes/company/admin/employees/forms/invite-employee.form-dialog.tsx
import { useState } from 'react';
import { useSubmit } from 'react-router';
import { FormDialog } from '~/components/dialog/form-dialog';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { RoleCheckboxes } from '~/routes/company/_components/role-checkboxes';

type InviteEmployeeFormData = {
  email: string;
  roles: Array<'ADMIN' | 'EMPLOYEE'>;
};

type InviteEmployeeFormProps = {
  trigger: React.ReactNode;
};

export function InviteEmployeeForm({ trigger }: InviteEmployeeFormProps) {
  const submit = useSubmit();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<InviteEmployeeFormData>({ email: '', roles: [] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('email', formData.email);
    data.append('roles', JSON.stringify(formData.roles));

    submit(data, {
      method: 'post',
      action: API_ROUTES_MAP['company.admin.employees.invite'].url,
    });

    setIsOpen(false);
    setFormData({ email: '', roles: [] });
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({ email: '', roles: [] });
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      <FormDialog<InviteEmployeeFormData>
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Inviter Medarbeider"
        formData={formData}
        onFieldChange={(name, value) => setFormData({ ...formData, [name]: value })}
        onSubmit={handleSubmit}
        fields={[
          {
            name: 'email',
            label: 'E-postadresse',
            type: 'email',
            placeholder: 'fornavn@firma.no',
            required: true,
          },
          {
            name: 'roles',
            label: 'Velg roller',
            render: ({ value, onChange }) => (
              <>
                <p className="text-xs text-muted-foreground mb-3">Velg én eller flere roller for den ansatte</p>
                <RoleCheckboxes value={value} onChange={onChange} />
              </>
            ),
          },
        ]}
        actions={[
          {
            label: 'Avbryt',
            variant: 'outline',
            onClick: handleCancel,
          },
          {
            label: 'Send invitasjon',
            type: 'submit',
            variant: 'default',
            onClick: () => {},
          },
        ]}
      />
    </>
  );
}

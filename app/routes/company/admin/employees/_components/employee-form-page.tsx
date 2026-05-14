import { Form, useNavigate, useNavigation } from 'react-router';
import { useEffect, useState } from 'react';
import { CompanyRole } from '~/api/clients/types';
import { RoleCheckboxes } from '~/routes/company/_components/role-checkboxes';
import { CompanyFormPageTemplate, FormField, Text, Button } from '~/ui';
import { ROUTES_MAP } from '~/lib/route-tree';

export type EmployeeFormValues = {
  userId?: number;
  email: string;
  roles: CompanyRole[];
};

type EmployeeFormPageProps = {
  mode: 'invite' | 'edit';
  values: EmployeeFormValues;
  actionData?: {
    error?: string;
    values?: EmployeeFormValues;
  } | null;
};

export function EmployeeFormPage({ mode, values, actionData }: EmployeeFormPageProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isEdit = mode === 'edit';
  const currentValues = actionData?.values ?? values;
  const [roles, setRoles] = useState<CompanyRole[]>(currentValues.roles);

  useEffect(() => {
    setRoles(currentValues.roles);
  }, [currentValues.roles]);

  return (
    <CompanyFormPageTemplate
      title={isEdit ? 'Rediger ansatt' : 'Inviter ansatt'}
      description="Flytt medarbeiderskjemaet ut av dialog og inn på en egen ruteside med samme kompakte struktur som resten av selskapssonen."
      backLink={{ to: ROUTES_MAP['company.admin.employees'].href, label: 'Tilbake til ansatte' }}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => navigate(ROUTES_MAP['company.admin.employees'].href)}>
            Avbryt
          </Button>
          <Button type="submit" form="employee-form" loading={isSubmitting}>
            {isEdit ? 'Lagre endringer' : 'Send invitasjon'}
          </Button>
        </>
      }
    >
      <Form id="employee-form" method="post" className="space-y-3">
        {currentValues.userId ? <input type="hidden" name="userId" value={currentValues.userId} /> : null}
        <input type="hidden" name="roles" value={JSON.stringify(roles)} />

        <div className="rounded-md border border-border bg-background p-3">
          <Text as="p" variant="label" className="text-text-primary">
            E-postadresse
          </Text>
          <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
            {isEdit ? 'E-post kan ikke endres her. Oppdater kun roller.' : 'Invitasjonen sendes til denne adressen.'}
          </Text>
          <FormField
            name="email"
            type="email"
            defaultValue={currentValues.email}
            placeholder="fornavn@firma.no"
            autoComplete="email"
            disabled={isEdit}
          />
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <Text as="p" variant="label" className="text-text-primary">
            Roller
          </Text>
          <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
            Velg én eller flere roller. Dette styrer tilgang og navigasjon i selskapssonen.
          </Text>
          <RoleCheckboxes value={roles} onChange={setRoles} />
        </div>
      </Form>
    </CompanyFormPageTemplate>
  );
}

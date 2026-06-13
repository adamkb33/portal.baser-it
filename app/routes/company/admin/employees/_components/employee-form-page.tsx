import { Form, useNavigate, useNavigation } from 'react-router';
import { useEffect, useState } from 'react';
import { CompanyRole } from '~/api/clients/types';
import { RoleCheckboxes } from '~/routes/company/_components/role-checkboxes';
import { CompanyFormPageTemplate, FormField, Label, Text, Button } from '~/ui';
import { ROUTES_MAP } from '~/lib/routing/route-tree';

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

          <FormField
            label="E-postadresse"
            name="email"
            type="email"
            defaultValue={currentValues.email}
            helperText={isEdit ? 'E-post kan ikke endres her. Oppdater kun roller.' : 'Invitasjonen sendes til denne adressen.'}
            placeholder="fornavn@firma.no"
            autoComplete="email"
            disabled={isEdit}
          />

        <div className="space-y-3">
          <Label>Roller</Label>
          <Text as="p" variant="body-sm" className="mb-3 text-text-secondary">
            Velg én eller flere roller. Dette styrer tilgang og navigasjon i selskapssonen.
          </Text>
          <RoleCheckboxes value={roles} onChange={setRoles} />
        </div>
      </Form>
    </CompanyFormPageTemplate>
  );
}

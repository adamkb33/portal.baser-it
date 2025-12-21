import type { CompanyRoles } from '~/api/clients/types';
import { Checkbox } from '~/components/ui/checkbox';

export const ROLE_OPTIONS = [
  { value: 'ADMIN' as const, label: 'Admin' },
  { value: 'EMPLOYEE' as const, label: 'Ansatt' },
];

export const RoleCheckboxes = ({
  value,
  onChange,
}: {
  value: CompanyRoles[];
  onChange: (roles: CompanyRoles[]) => void;
}) => (
  <div className="space-y-3">
    {ROLE_OPTIONS.map((role) => (
      <div key={role.value} className="flex flex-row items-center space-x-3 space-y-0">
        <Checkbox
          checked={value?.includes(role.value)}
          onCheckedChange={(checked) => {
            const currentRoles = value || [];
            const newRoles = checked
              ? [...currentRoles, role.value]
              : currentRoles.filter((r: CompanyRoles) => r !== role.value);
            onChange(newRoles);
          }}
        />
        <label className="text-sm font-normal cursor-pointer">{role.label}</label>
      </div>
    ))}
  </div>
);

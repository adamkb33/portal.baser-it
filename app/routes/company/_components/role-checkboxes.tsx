import { CompanyRole } from '~/api/clients/types';
import { Checkbox } from '~/ui';

export const ROLE_OPTIONS = [
  { value: CompanyRole.ADMIN as const, label: 'Administrator', description: 'Full tilgang til alle funksjoner' },
  { value: CompanyRole.EMPLOYEE as const, label: 'Ansatt', description: 'Standard tilgang for medarbeidere' },
];

export const RoleCheckboxes = ({
  value,
  onChange,
}: {
  value: CompanyRole[];
  onChange: (roles: CompanyRole[]) => void;
}) => (
  <div className="space-y-2">
    {ROLE_OPTIONS.map((role) => {
      const isChecked = value?.includes(role.value);

      return (
        <label
          key={role.value}
          className={`
            group relative flex items-start gap-3 p-3 md:p-4 rounded border cursor-pointer
            transition-all duration-200
            ${
              isChecked
                ? 'border-interactive bg-surface'
                : 'border-border bg-background hover:border-interactive hover:bg-surface'
            }
            focus-within:ring-2 focus-within:ring-interactive focus-within:ring-offset-2
          `}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => {
              const currentRoles = value || [];
              const newRoles = checked
                ? [...currentRoles, role.value]
                : currentRoles.filter((r: CompanyRole) => r !== role.value);
              onChange(newRoles);
            }}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div
              className={`text-sm font-semibold leading-tight transition-colors duration-200 ${isChecked ? 'text-interactive' : 'text-text-primary'}`}
            >
              {role.label}
            </div>
            <div className="mt-1 text-xs leading-relaxed text-text-secondary">{role.description}</div>
          </div>

          {isChecked && (
            <div
              className="absolute right-2 top-2 h-2 w-2 rounded-full bg-interactive animate-in fade-in zoom-in duration-200 md:right-3 md:top-3"
              aria-hidden="true"
            />
          )}
        </label>
      );
    })}
  </div>
);

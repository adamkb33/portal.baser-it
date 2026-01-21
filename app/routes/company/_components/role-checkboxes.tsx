import { Checkbox } from '~/components/ui/checkbox';
import { CompanyRole } from '~/api/clients/types';

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
                ? 'bg-primary/5 border-primary/30 shadow-2xs'
                : 'bg-background border-border hover:border-primary/20 hover:bg-accent/5'
            }
            focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
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
              className={`text-sm font-semibold transition-colors duration-200 leading-tight ${isChecked ? 'text-primary' : 'text-foreground'}`}
            >
              {role.label}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{role.description}</div>
          </div>

          {isChecked && (
            <div
              className="absolute top-2 md:top-3 right-2 md:right-3 h-2 w-2 rounded-full bg-primary animate-in fade-in zoom-in duration-200"
              aria-hidden="true"
            />
          )}
        </label>
      );
    })}
  </div>
);

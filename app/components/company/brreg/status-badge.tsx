import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  label: string;
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
}

export function StatusBadge({
  label,
  isActive,
  activeText = 'Registrert',
  inactiveText = 'Ikke registrert',
}: StatusBadgeProps) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd>
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className={isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
        >
          {isActive ? activeText : inactiveText}
        </Badge>
      </dd>
    </div>
  );
}

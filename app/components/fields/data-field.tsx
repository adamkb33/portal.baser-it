interface DataFieldProps {
  label: string;
  value?: string | number | null;
  fallback?: string;
  className?: string;
}

export function DataField({ label, value, fallback = 'Ikke oppgitt', className = '' }: DataFieldProps) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 text-gray-900">{value ?? fallback}</dd>
    </div>
  );
}

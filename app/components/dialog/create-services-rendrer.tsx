import type { FormFieldRenderProps } from '~/components/dialog/form-dialog';

interface Service {
  id: number;
  name: string;
}

interface ServicesSelectionRendererProps {
  services: Service[];
  helperText?: string;
  maxHeight?: string;
  emptyText?: string;
}

/**
 * Reusable services selection renderer for FormDialog
 *
 * @example
 * ```tsx
 * import { createServicesSelectionRenderer } from '~/components/renderers/services-selection-renderer';
 *
 * const renderServicesSelection = createServicesSelectionRenderer({
 *   services: availableServices,
 *   helperText: 'Velg tjenestene du er interessert i...',
 *   maxHeight: 'max-h-48',
 * });
 *
 * // Use in FormDialog field
 * {
 *   name: 'services',
 *   label: 'Foretrukne tjenester',
 *   render: renderServicesSelection,
 * }
 * ```
 */
export const createServicesSelectionRenderer = ({
  services,
  helperText = 'Velg tjenestene du er interessert i eller som du vanligvis booker.',
  maxHeight = 'max-h-48',
  emptyText = 'Ingen tjenester tilgjengelig',
}: ServicesSelectionRendererProps) => {
  return ({ value, onChange }: FormFieldRenderProps<any>) => {
    const selectedServices = (value as number[]) || [];

    const toggleService = (serviceId: number) => {
      const isSelected = selectedServices.includes(serviceId);
      const updated = isSelected ? selectedServices.filter((id) => id !== serviceId) : [...selectedServices, serviceId];
      onChange(updated);
    };

    return (
      <div className="space-y-2">
        <div className={`${maxHeight} space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3`}>
          {services.length === 0 ? (
            <p className="text-xs text-slate-400">{emptyText}</p>
          ) : (
            services.map((service) => (
              <label
                key={service.id}
                className="flex cursor-pointer items-center gap-2.5 rounded border border-transparent px-2 py-1.5 text-sm transition hover:border-slate-200 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-sm text-slate-700">{service.name}</span>
              </label>
            ))
          )}
        </div>
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  };
};

/**
 * Direct component version (alternative approach)
 */
export const ServicesSelectionRenderer = ({
  value,
  onChange,
  services,
  helperText = 'Velg tjenestene du er interessert i eller som du vanligvis booker.',
  maxHeight = 'max-h-48',
  emptyText = 'Ingen tjenester tilgjengelig',
}: FormFieldRenderProps<any> & ServicesSelectionRendererProps) => {
  const selectedServices = (value as number[]) || [];

  const toggleService = (serviceId: number) => {
    const isSelected = selectedServices.includes(serviceId);
    const updated = isSelected ? selectedServices.filter((id) => id !== serviceId) : [...selectedServices, serviceId];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className={`${maxHeight} space-y-1.5 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3`}>
        {services.length === 0 ? (
          <p className="text-xs text-slate-400">{emptyText}</p>
        ) : (
          services.map((service) => (
            <label
              key={service.id}
              className="flex cursor-pointer items-center gap-2.5 rounded border border-transparent px-2 py-1.5 text-sm transition hover:border-slate-200 hover:bg-white"
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={() => toggleService(service.id)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-sm text-slate-700">{service.name}</span>
            </label>
          ))
        )}
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
};

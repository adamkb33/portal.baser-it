import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import type { GroupedServiceGroupsDto } from 'tmp/openapi/gen/booking';

export type ServicePickerProps = {
  groupedServices: GroupedServiceGroupsDto[];
  selectedServiceIds: number[];
  onChange: (ids: number[]) => void;
};

export function ServicePicker({ groupedServices, selectedServiceIds, onChange }: ServicePickerProps) {
  const toggleService = (serviceId: number) => {
    onChange(
      selectedServiceIds.includes(serviceId)
        ? selectedServiceIds.filter((id) => id !== serviceId)
        : [...selectedServiceIds, serviceId],
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {groupedServices
          .filter((group) => group.services.length > 0)
          .map((group) => (
            <div key={group.id}>
              <h4 className="font-semibold mb-3">{group.name}</h4>
              <div className="flex flex-wrap gap-2">
                {group.services.map((service) => {
                  const selected = selectedServiceIds.includes(service.id);
                  return (
                    <Button
                      key={service.id}
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleService(service.id)}
                    >
                      {service.name} — {service.price} kr / {service.duration} min
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {selectedServiceIds.length > 0 && (
        <div className="pt-2">
          <h5 className="text-sm text-muted-foreground mb-2">Valgte tjenester:</h5>
          <div className="flex flex-wrap gap-2">
            {groupedServices.flatMap((group) =>
              group.services
                .filter((s) => selectedServiceIds.includes(s.id))
                .map((s) => (
                  <Badge key={s.id} variant="secondary">
                    {s.name}
                  </Badge>
                )),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

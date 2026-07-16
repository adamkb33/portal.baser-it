import type { GroupedServiceDto, GroupedServiceGroupDto } from '~/api/generated/booking';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/ui';
import { ServiceCard } from './service-card';

type ServiceGroupProps = {
  group: GroupedServiceGroupDto;
  selectedServiceQuantities: Map<number, number>;
  onSetServiceQuantity: (serviceId: number, nextQuantity: number) => void;
  onViewImages: (service: GroupedServiceDto) => void;
};

export function ServiceGroup({
  group,
  selectedServiceQuantities,
  onSetServiceQuantity,
  onViewImages,
}: ServiceGroupProps) {
  const selectedInGroup = group.services.reduce(
    (sum, service) => sum + (selectedServiceQuantities.get(service.id) ?? 0),
    0,
  );
  const multiQuantityServices = group.services
    .map((service) => ({
      service,
      quantity: selectedServiceQuantities.get(service.id) ?? 0,
    }))
    .filter((item) => item.quantity > 1);

  return (
    <div>
      <Accordion
        type="single"
        collapsible
        className="rounded-[var(--radius-booking-panel)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-muted"
      >
        <AccordionItem value={String(group.id)} className="border-none">
          <div className="flex items-start gap-3 px-3 py-3 md:px-4 md:py-4">
            <AccordionTrigger className="flex-1 p-0 text-left hover:no-underline data-[state=open]:bg-booking-surface-muted">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-booking-text md:text-lg">{group.name}</h2>
                  {selectedInGroup > 0 && (
                    <span className="rounded-[var(--radius-booking-badge)] border-[length:var(--border-booking-card)] border-booking-action bg-booking-action-muted px-2.5 py-0.5 text-xs font-semibold text-booking-action">
                      {selectedInGroup} valgt
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-booking-text-muted md:text-sm">
                  {group.services.length} {group.services.length === 1 ? 'tjeneste' : 'tjenester'}
                </p>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent className="border-t border-booking-border bg-booking-surface-muted p-3 md:p-4">
            {multiQuantityServices.length > 0 ? (
              <div className="mb-4 rounded-[var(--radius-booking-card)] border-[length:var(--border-booking-card)] border-booking-action/30 bg-booking-action-muted p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-booking-badge)] bg-booking-action text-sm font-bold text-booking-action-contrast">
                    {multiQuantityServices.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-booking-text">Du har valgt flere av samme tjeneste</p>
                    <p className="mt-1 text-sm text-booking-text-muted">
                      {multiQuantityServices.map((item) => `${item.quantity} x ${item.service.name}`).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
              {group.services.map((service, index) => {
                const quantity = selectedServiceQuantities.get(service.id) ?? 0;

                return (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={index}
                    quantity={quantity}
                    onQuantityChange={(nextQuantity) => onSetServiceQuantity(service.id, nextQuantity)}
                    onViewImages={() => onViewImages(service)}
                  />
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

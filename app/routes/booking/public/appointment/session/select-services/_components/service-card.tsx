import { Check, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';
import type { GroupedServiceDto } from '~/api/generated/booking';
import { ServiceQuantityControl } from '~/routes/booking/public/_components/booking.service-quantity-control';
import { Button, Card, CardFooter, cn } from '~/ui';

type ServiceCardProps = {
  service: GroupedServiceDto;
  index: number;
  quantity: number;
  onQuantityChange: (nextQuantity: number) => void;
  onViewImages?: () => void;
  disableIncrement?: boolean;
};

export function ServiceCard({
  service,
  index,
  quantity,
  onQuantityChange,
  onViewImages,
  disableIncrement,
}: ServiceCardProps) {
  const isSelected = quantity > 0;
  const hasImages = service.images && service.images.length > 0;
  const previewImage = hasImages ? service.images && service.images[0] : null;
  const alternatingSurface = index % 2 === 0 ? 'bg-booking-surface-raised' : 'bg-booking-accent-muted';

  return (
    <Card
      variant={isSelected ? 'emphasis' : 'interactive'}
      className={cn(
        'group relative h-full overflow-hidden border-booking-border shadow-[var(--shadow-booking-card)] transition-all',
        alternatingSurface,
        !isSelected && 'hover:bg-booking-action-muted',
        isSelected &&
          'border-booking-action bg-booking-action-muted ring-[length:var(--border-booking-focus-ring)] ring-booking-action/35',
      )}
    >
      {previewImage && (
        <div className="relative -mx-3 -mt-3 mb-3 h-32 overflow-hidden border-b border-booking-border md:-mx-4 md:-mt-4 md:mb-4 md:h-40">
          <img
            src={previewImage.url}
            alt={service.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />

          {service.images && service.images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-[var(--radius-booking-badge)] border-[length:var(--border-booking-card)] border-booking-border bg-booking-surface-raised px-2 py-1">
              <ImageIcon className="size-3 text-booking-text-muted" />
              <span className="text-xs font-semibold text-booking-text">{service.images.length}</span>
            </div>
          )}

          {isSelected && (
            <div className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-[var(--radius-booking-badge)] border-[length:var(--border-booking-card)] border-booking-action bg-booking-action">
              {quantity > 1 ? (
                <span className="text-sm font-bold text-booking-action-contrast">{quantity}</span>
              ) : (
                <Check className="size-5 text-booking-action-contrast" strokeWidth={3} />
              )}
            </div>
          )}
        </div>
      )}

      <div className="mb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-base font-bold text-booking-text md:text-lg">{service.name}</h3>

          {!previewImage && isSelected && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-booking-badge)] border-[length:var(--border-booking-card)] border-booking-action bg-booking-action">
              {quantity > 1 ? (
                <span className="text-xs font-bold text-booking-action-contrast">{quantity}</span>
              ) : (
                <Check className="size-4 text-booking-action-contrast" strokeWidth={3} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 font-bold text-booking-action">
            <DollarSign className="size-4" />
            <span>{service.price} kr</span>
          </div>

          <div className="flex items-center gap-1.5 text-booking-text-muted">
            <Clock className="size-4" />
            <span>Fra {service.duration} min</span>
          </div>
        </div>
      </div>

      <CardFooter className="mt-0 flex gap-2">
        {hasImages && (
          <Button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewImages?.();
            }}
            variant="booking-secondary"
            className="flex-1 gap-2"
          >
            <ImageIcon className="size-4" />
            <span className="hidden sm:inline">Vis bilder</span>
            <span className="sm:hidden">Bilder</span>
          </Button>
        )}

        <ServiceQuantityControl quantity={quantity} onChange={onQuantityChange} disableIncrement={disableIncrement} />
      </CardFooter>
    </Card>
  );
}

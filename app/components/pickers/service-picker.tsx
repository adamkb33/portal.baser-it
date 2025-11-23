import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '~/components/ui/carousel';
import type { GroupedServiceGroupsDto, GroupedService, ImageDto } from 'tmp/openapi/gen/booking';

export type ServicePickerProps = {
  groupedServices: GroupedServiceGroupsDto[];
  selectedServiceIds: number[];
  onChange: (ids: number[]) => void;
};

export function ServicePicker({ groupedServices, selectedServiceIds, onChange }: ServicePickerProps) {
  const [dialogService, setDialogService] = useState<GroupedService | null>(null);

  const toggleService = (serviceId: number) => {
    onChange(
      selectedServiceIds.includes(serviceId)
        ? selectedServiceIds.filter((id) => id !== serviceId)
        : [...selectedServiceIds, serviceId],
    );
  };

  const handleOpenImages = (service: GroupedService) => {
    if (!service.images || service.images.length === 0) return;
    setDialogService(service);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setDialogService(null);
  };

  const renderServiceImagesCarousel = (images: ImageDto[], serviceName: string) => {
    if (images.length === 0) return null;

    return (
      <div className="mt-6 space-y-4">
        <div className="border-2 border-foreground/40 bg-muted p-3 sm:p-4">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((image) => (
                <CarouselItem key={image.id ?? image.url} className="flex justify-center">
                  <div className="w-full max-w-xl overflow-hidden border-2 border-foreground/60 bg-background">
                    <img
                      src={image.url}
                      alt={image.label || serviceName}
                      loading="lazy"
                      className="h-72 w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="border-2 border-foreground/80 bg-background" />
                <CarouselNext className="border-2 border-foreground/80 bg-background" />
              </>
            )}
          </Carousel>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          {images.map((image) => (
            <span key={`meta-${image.id ?? image.url}`} className="border px-2 py-1">
              {image.label ?? serviceName}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 border-2 border-foreground/40 bg-background p-4 sm:p-6">
        <div className="space-y-6">
          {groupedServices
            .filter((group) => group.services.length > 0)
            .map((group) => (
              <section
                key={group.id}
                className="border-t border-dashed border-foreground/30 pt-4 first:border-t-0 first:pt-0"
              >
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.name}
                </h4>

                <div className="flex flex-wrap gap-3">
                  {group.services.map((service) => {
                    const selected = selectedServiceIds.includes(service.id);
                    const hasImages = !!service.images && service.images.length > 0;

                    return (
                      <div key={service.id} className="flex flex-col items-start gap-1">
                        <Button
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={[
                            'border-2 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em]',
                            'rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,0.9)]',
                            selected ? 'bg-foreground text-background' : 'bg-background text-foreground',
                          ].join(' ')}
                        >
                          <span className="flex flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-3">
                            <span>{service.name}</span>
                            <span className="text-[0.65rem] font-normal uppercase text-muted-foreground">
                              {service.price} kr · {service.duration} min
                            </span>
                          </span>
                        </Button>

                        {hasImages && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleOpenImages(service)}
                            className="px-0 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:underline"
                          >
                            Vis bilder
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>

        {selectedServiceIds.length > 0 && (
          <div className="border-t-2 border-foreground/40 pt-4">
            <h5 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Valgte tjenester
            </h5>
            <div className="flex flex-wrap gap-2">
              {groupedServices.flatMap((group) =>
                group.services
                  .filter((s) => selectedServiceIds.includes(s.id))
                  .map((s) => (
                    <Badge
                      key={s.id}
                      variant="secondary"
                      className="rounded-none border-2 border-foreground/60 bg-background px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em]"
                    >
                      {s.name}
                    </Badge>
                  )),
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogService != null} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl border-2 border-foreground/80 bg-background px-5 py-6 sm:px-8 sm:py-8 rounded-none">
          {dialogService && (
            <>
              <DialogHeader className="space-y-2 border-b-2 border-foreground/40 pb-4">
                <DialogTitle className="text-base font-semibold uppercase tracking-[0.18em]">
                  {dialogService.name}
                </DialogTitle>
                <DialogDescription className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Bilder for denne tjenesten.
                </DialogDescription>
              </DialogHeader>

              {dialogService.images && renderServiceImagesCarousel(dialogService.images, dialogService.name)}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

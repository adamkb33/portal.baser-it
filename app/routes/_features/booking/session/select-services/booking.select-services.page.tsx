import { useEffect, useMemo, useRef, useState } from 'react';
import { Form, useLoaderData, useNavigation } from 'react-router';
import { Check, Clock, DollarSign, Image as ImageIcon, Search, Sparkles, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  BookingStepTemplate,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Container,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  Stack,
} from '~/ui';
import { cn } from '@/lib/utils';
import type { GroupedServiceDto, GroupedServiceGroupDto } from '~/api/generated/booking';
import { BookingBottomActionBar } from '~/routes/_features/booking/_components/bottom-nav';
import { ServiceQuantityControl } from '~/routes/_features/booking/_components/booking.service-quantity-control';
import type { createBookingSelectServicesLoader } from './booking.select-services.loader';

interface ServiceCardProps {
  service: GroupedServiceDto;
  index: number;
  quantity: number;
  onQuantityChange: (nextQuantity: number) => void;
  onViewImages?: () => void;
}

function ServiceCard({ service, index, quantity, onQuantityChange, onViewImages }: ServiceCardProps) {
  const isSelected = quantity > 0;
  const hasImages = service.images && service.images.length > 0;
  const previewImage = hasImages ? service.images && service.images[0] : null;
  const alternatingSurface = index % 2 === 0 ? 'bg-background' : 'bg-secondary/10';

  return (
    <Card
      variant={isSelected ? 'emphasis' : 'interactive'}
      className={cn(
        'group relative h-full overflow-hidden border-border shadow-sm transition-all',
        alternatingSurface,
        !isSelected && 'hover:bg-primary/5',
        isSelected && 'border-interactive bg-surface-primary-subtle ring-2 ring-interactive/35',
      )}
    >
      {previewImage && (
        <div className="relative -mx-3 -mt-3 mb-3 h-32 overflow-hidden border-b border-border md:-mx-4 md:-mt-4 md:mb-4 md:h-40">
          <img
            src={previewImage.url}
            alt={service.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />

          {service.images && service.images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1">
              <ImageIcon className="size-3 text-text-muted" />
              <span className="text-xs font-semibold text-text-primary">{service.images.length}</span>
            </div>
          )}

          {isSelected && (
            <div className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full border border-interactive bg-interactive">
              {quantity > 1 ? (
                <span className="text-sm font-bold text-text-inverse">{quantity}</span>
              ) : (
                <Check className="size-5 text-text-inverse" strokeWidth={3} />
              )}
            </div>
          )}
        </div>
      )}

      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-base font-bold text-text-primary md:text-lg">{service.name}</h3>

          {!previewImage && isSelected && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-interactive bg-interactive">
              {quantity > 1 ? (
                <span className="text-xs font-bold text-text-inverse">{quantity}</span>
              ) : (
                <Check className="size-4 text-text-inverse" strokeWidth={3} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 font-bold text-interactive">
            <DollarSign className="size-4" />
            <span>{service.price} kr</span>
          </div>

          <div className="flex items-center gap-1.5 text-text-muted">
            <Clock className="size-4" />
            <span>{service.duration} min</span>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="mt-0 flex gap-2">
        {hasImages && (
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewImages?.();
            }}
            variant="outline"
            className="flex-1 gap-2"
          >
            <ImageIcon className="size-4" />
            <span className="hidden sm:inline">Vis bilder</span>
            <span className="sm:hidden">Bilder</span>
          </Button>
        )}

        <ServiceQuantityControl quantity={quantity} onChange={onQuantityChange} />
      </CardFooter>
    </Card>
  );
}

interface ServiceGroupProps {
  group: GroupedServiceGroupDto;
  selectedServiceQuantities: Map<number, number>;
  onSetServiceQuantity: (serviceId: number, nextQuantity: number) => void;
  onViewImages: (service: GroupedServiceDto) => void;
}

function ServiceGroup({ group, selectedServiceQuantities, onSetServiceQuantity, onViewImages }: ServiceGroupProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  const handleAccordionChange = (nextValue: string | undefined) => {
    if (nextValue) {
      requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  };

  return (
    <div ref={containerRef}>
      <Accordion
        type="single"
        collapsible
        onValueChange={handleAccordionChange}
        className="rounded-lg border border-border bg-surface"
      >
        <AccordionItem value={String(group.id)} className="border-none">
          <div className="flex items-start gap-3 px-3 py-3 md:px-4 md:py-4">
            <AccordionTrigger className="flex-1 bg-surface p-0 text-left hover:bg-surface hover:no-underline data-[state=open]:bg-surface">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-text-primary md:text-lg">{group.name}</h2>
                  {selectedInGroup > 0 && (
                    <span className="rounded-full border border-interactive bg-surface-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-interactive">
                      {selectedInGroup} valgt
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-muted md:text-sm">
                  {group.services.length} {group.services.length === 1 ? 'tjeneste' : 'tjenester'}
                </p>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent className="border-t border-border bg-surface p-3 md:p-4">
            {multiQuantityServices.length > 0 ? (
              <div className="mb-4 rounded-md border border-interactive/30 bg-primary/5 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-interactive text-sm font-bold text-text-inverse">
                    {multiQuantityServices.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Du har valgt flere av samme tjeneste</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {multiQuantityServices
                        .map((item) => `${item.quantity} x ${item.service.name}`)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
              {group.services.map((service, index) =>
                (() => {
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
                })(),
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function BookingSelectServicesPage() {
  const loaderData = useLoaderData<ReturnType<typeof createBookingSelectServicesLoader>>();
  const serviceGroups = loaderData.serviceGroups ?? [];
  const session = loaderData.session;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [selectedServiceQuantities, setSelectedServiceQuantities] = useState<Map<number, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogService, setDialogService] = useState<GroupedServiceDto | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const nextMap = new Map<number, number>();
    for (const selectedService of session.selectedServices ?? []) {
      const serviceId = Number(selectedService.serviceId);
      const quantity = Number(selectedService.quantity);
      if (Number.isInteger(serviceId) && serviceId > 0 && Number.isInteger(quantity) && quantity > 0) {
        nextMap.set(serviceId, quantity);
      }
    }
    setSelectedServiceQuantities(nextMap);
  }, [session]);

  if (!session) {
    return (
      <Container size="lg">
        <PageHeader title="Velg tjenester" description="Ugyldig økt" />
      </Container>
    );
  }

  const findService = (serviceId: number): GroupedServiceDto | undefined => {
    for (const group of serviceGroups) {
      const service = group.services.find((candidate) => candidate.id === serviceId);
      if (service) return service;
    }
    return undefined;
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return serviceGroups;

    const query = searchQuery.toLowerCase();
    return serviceGroups
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => service.name.toLowerCase().includes(query)),
      }))
      .filter((group) => group.services.length > 0);
  }, [serviceGroups, searchQuery]);

  const setServiceQuantity = (serviceId: number, nextQuantity: number) => {
    setSelectedServiceQuantities((prev) => {
      const next = new Map(prev);
      if (nextQuantity <= 0) {
        next.delete(serviceId);
      } else {
        next.set(serviceId, nextQuantity);
      }
      return next;
    });
  };

  const selectedServicesList = useMemo(() => {
    return Array.from(selectedServiceQuantities.entries())
      .map(([serviceId, quantity]) => {
        const service = findService(serviceId);
        return service ? { service, quantity } : null;
      })
      .filter((item): item is { service: GroupedServiceDto; quantity: number } => item !== null);
  }, [selectedServiceQuantities]);

  const hasSelections = selectedServicesList.length > 0;
  const submitFormId = 'booking-select-services-submit-form';
  const totalServices = serviceGroups.reduce((sum, group) => sum + group.services.length, 0);

  return (
    <>
      <BookingStepTemplate
        label="Velg tjenester"
        title="Hvilke tjenester ønsker du?"
        description={`Velg én eller flere tjenester fra ${totalServices} tilgjengelige tjenester.`}
      >
        <Stack space="lg">
          {totalServices > 6 && (
            <div className="relative rounded-lg border border-border bg-surface p-2 md:p-3">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="size-5 text-text-muted" />
              </div>

              <Input
                type="text"
                placeholder="Søk etter tjenester..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-11 pr-11"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-surface-variant-2"
                >
                  <X className="size-4 text-text-muted" />
                </button>
              )}
            </div>
          )}

          <Stack space="lg">
            {filteredGroups.length > 0 ? (
              filteredGroups
                .filter((group) => group.services.length > 0)
                .map((group) => (
                  <ServiceGroup
                    key={group.id}
                    group={group}
                    selectedServiceQuantities={selectedServiceQuantities}
                    onSetServiceQuantity={setServiceQuantity}
                    onViewImages={setDialogService}
                  />
                ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-variant-1 py-12 text-center">
                <Search className="size-12 text-text-muted opacity-50" />
                <p className="mt-4 text-base font-medium text-text-primary">Ingen tjenester funnet</p>
                <p className="mt-1 text-sm text-text-muted">Prøv et annet søkeord</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm font-medium text-interactive hover:underline"
                >
                  Tilbakestill søk
                </button>
              </div>
            )}
          </Stack>
        </Stack>

        <Dialog open={dialogService !== null} onOpenChange={(open) => !open && setDialogService(null)}>
          <DialogContent className="max-w-3xl gap-0 p-0">
            {dialogService && (
              <>
                <DialogHeader className="border-b border-booking-border p-4 md:p-6">
                  <DialogTitle className="text-base font-bold text-text-primary md:text-lg">
                    {dialogService.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-text-muted">
                    {dialogService.images?.length} {dialogService.images?.length === 1 ? 'bilde' : 'bilder'}
                  </DialogDescription>
                </DialogHeader>

                {dialogService.images && dialogService.images.length > 0 && (
                  <div className="p-4 md:p-6">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {dialogService.images.map((image, index) => (
                          <CarouselItem key={image.id ?? index}>
                            <div className="flex justify-center">
                              <div className="relative w-full max-w-xl overflow-hidden rounded-lg">
                                <img
                                  src={image.url}
                                  alt={image.label || `${dialogService.name} - Bilde ${index + 1}`}
                                  className="h-64 w-full object-cover md:h-96"
                                />

                                {image.label && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <p className="text-sm font-medium text-white">{image.label}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>

                      {dialogService.images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        <Form id={submitFormId} method="post" className="hidden">
          {Array.from(selectedServiceQuantities.entries()).map(([serviceId, quantity]) => (
            <input key={serviceId} type="hidden" name={`serviceQuantity:${serviceId}`} value={quantity} />
          ))}
        </Form>
      </BookingStepTemplate>

      <BookingBottomActionBar
        actions={[
          {
            id: 'back',
            type: 'link',
            to: loaderData.navigation.employee,
            label: 'Tilbake',
            variant: 'secondary',
          },
          {
            id: 'continue',
            type: 'button',
            form: submitFormId,
            buttonType: 'submit',
            label: 'Fortsett',
            icon: <Sparkles className="size-4" />,
            variant: 'primary',
            loading: isSubmitting,
            disabled: !hasSelections || isSubmitting,
          },
        ]}
        compact
      />
    </>
  );
}

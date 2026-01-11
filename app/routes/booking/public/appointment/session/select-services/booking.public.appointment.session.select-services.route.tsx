import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData, useNavigation } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  X,
  Clock,
  DollarSign,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';
import { cn } from '~/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '~/components/ui/carousel';
import type { AppointmentSessionDto, GroupedServiceGroupsDto } from '~/api/clients/types';
import type { GroupedServiceDto } from 'tmp/openapi/gen/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { BookingContainer, BookingPageHeader, BookingButton, BookingCard } from '../../_components/booking-layout';

export type AppointmentsSelectServicesLoaderData = {
  session: AppointmentSessionDto;
  serviceGroups: GroupedServiceGroupsDto[];
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    const serviceGroupsResponse =
      await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.getAppointmentSessionProfileServices(
        {
          sessionId: session.sessionId,
        },
      );

    return data<AppointmentsSelectServicesLoaderData>({
      session,
      serviceGroups: serviceGroupsResponse.data || [],
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);

    if (!session) {
      return redirect(ROUTES_MAP['booking.public.appointment'].href);
    }

    const formData = await request.formData();
    const selectedServices = formData.getAll('serviceId').map(Number);

    await bookingApi().PublicAppointmentSessionControllerService.PublicAppointmentSessionControllerService.selectAppointmentSessionProfileServices(
      {
        sessionId: session.sessionId,
        selectedServiceIds: selectedServices,
      },
    );

    return redirect(ROUTES_MAP['booking.public.appointment.session.select-time'].href);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

/* ========================================
   SERVICE CARD - Interactive, visual feedback
   ======================================== */

interface ServiceCardProps {
  service: GroupedServiceDto;
  isSelected: boolean;
  onToggle: () => void;
  onViewImages?: () => void;
}

function ServiceCard({ service, isSelected, onToggle, onViewImages }: ServiceCardProps) {
  const hasImages = service.images && service.images.length > 0;
  const previewImage = hasImages ? service.images && service.images[0] : null;

  return (
    <BookingCard
      selected={isSelected}
      onClick={onToggle}
      className={cn('group relative overflow-hidden transition-all', isSelected && 'ring-2 ring-primary ring-offset-2')}
    >
      {/* Image Preview */}
      {previewImage && (
        <div className="relative -mx-3 -mt-3 mb-3 h-32 overflow-hidden md:-mx-4 md:-mt-4 md:mb-4 md:h-40">
          <img
            src={previewImage.url}
            alt={service.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Image count badge */}
          {service.images && service.images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
              <ImageIcon className="size-3 text-white" />
              <span className="text-xs font-semibold text-white">{service.images.length}</span>
            </div>
          )}

          {/* Selected checkmark */}
          {isSelected && (
            <div className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-primary shadow-lg">
              <Check className="size-5 text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>
      )}

      {/* Service Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-base font-bold text-card-text md:text-lg">{service.name}</h3>

          {!previewImage && isSelected && (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary">
              <Check className="size-4 text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Price & Duration */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <DollarSign className="size-4" />
            <span>{service.price} kr</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" />
            <span>{service.duration} min</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2 border-t border-card-border pt-3">
        {hasImages && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewImages?.();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-card-border bg-card-accent/5 px-3 py-2 text-sm font-medium transition-colors hover:bg-card-accent/10"
          >
            <ImageIcon className="size-4" />
            <span className="hidden sm:inline">Vis bilder</span>
            <span className="sm:hidden">Bilder</span>
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            isSelected
              ? 'border-2 border-primary bg-primary/10 text-primary hover:bg-primary/20'
              : 'border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          {isSelected ? (
            <>
              <Check className="size-4" strokeWidth={3} />
              Valgt
            </>
          ) : (
            <>Velg</>
          )}
        </button>
      </div>
    </BookingCard>
  );
}

/* ========================================
   SERVICE GROUP - Collapsible section
   ======================================== */

interface ServiceGroupProps {
  group: GroupedServiceGroupsDto;
  selectedServices: Set<number>;
  onToggleService: (serviceId: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onViewImages: (service: GroupedServiceDto) => void;
}

function ServiceGroup({
  group,
  selectedServices,
  onToggleService,
  onSelectAll,
  onDeselectAll,
  onViewImages,
}: ServiceGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedInGroup = group.services.filter((s) => selectedServices.has(s.id)).length;
  const allSelected = selectedInGroup === group.services.length;
  const someSelected = selectedInGroup > 0 && !allSelected;

  return (
    <section className="rounded-lg border border-card-border bg-card">
      {/* Group Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-card-accent/5 md:p-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-card-text md:text-lg">{group.name}</h2>

            {selectedInGroup > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                {selectedInGroup} valgt
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            {group.services.length} {group.services.length === 1 ? 'tjeneste' : 'tjenester'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick select all */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              allSelected || someSelected ? onDeselectAll() : onSelectAll();
            }}
            className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            {allSelected || someSelected ? 'Fjern alle' : 'Velg alle'}
          </button>

          {isExpanded ? (
            <ChevronUp className="size-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Services Grid - Collapsible */}
      {isExpanded && (
        <div className="border-t border-card-border p-3 md:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
            {group.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServices.has(service.id)}
                onToggle={() => onToggleService(service.id)}
                onViewImages={() => onViewImages(service)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ========================================
   MAIN COMPONENT
   ======================================== */

export default function BookingPublicAppointmentSessionSelectServicesRoute() {
  const { serviceGroups, session } = useLoaderData<AppointmentsSelectServicesLoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogService, setDialogService] = useState<GroupedServiceDto | null>(null);

  useEffect(() => {
    if (session.selectedServices) {
      setSelectedServices(new Set(session.selectedServices));
    }
  }, [session]);

  // Service lookup helpers
  const findService = (serviceId: number): GroupedServiceDto | undefined => {
    for (const group of serviceGroups) {
      const service = group.services.find((s) => s.id === serviceId);
      if (service) return service;
    }
    return undefined;
  };

  // Filter service groups by search
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

  // Selection handlers
  const toggleService = (serviceId: number) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const selectAllInGroup = (group: GroupedServiceGroupsDto) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      group.services.forEach((service) => newSet.add(service.id));
      return newSet;
    });
  };

  const deselectAllInGroup = (group: GroupedServiceGroupsDto) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      group.services.forEach((service) => newSet.delete(service.id));
      return newSet;
    });
  };

  // Calculate totals
  const selectedServicesList = useMemo(() => {
    return Array.from(selectedServices)
      .map(findService)
      .filter((s): s is GroupedServiceDto => s !== undefined);
  }, [selectedServices]);

  const totalDuration = selectedServicesList.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServicesList.reduce((sum, s) => sum + s.price, 0);
  const hasSelections = selectedServices.size > 0;

  // Total service count
  const totalServices = serviceGroups.reduce((sum, g) => sum + g.services.length, 0);

  return (
    <>
      <BookingContainer>
        {/* ========================================
            PAGE HEADER
            ======================================== */}
        <BookingPageHeader
          title="Velg tjenester"
          description={`Velg én eller flere tjenester fra ${totalServices} tilgjengelige tjenester.`}
        />

        {/* ========================================
            SEARCH BAR - For many services
            ======================================== */}
        {totalServices > 6 && (
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="size-5 text-muted-foreground" />
            </div>

            <input
              type="text"
              placeholder="Søk etter tjenester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-lg border border-card-border bg-card pl-11 pr-11 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-muted"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* ========================================
            SERVICE GROUPS
            ======================================== */}
        <div className="space-y-4 md:space-y-5">
          {filteredGroups.length > 0 ? (
            filteredGroups
              .filter((group) => group.services.length > 0)
              .map((group) => (
                <ServiceGroup
                  key={group.id}
                  group={group}
                  selectedServices={selectedServices}
                  onToggleService={toggleService}
                  onSelectAll={() => selectAllInGroup(group)}
                  onDeselectAll={() => deselectAllInGroup(group)}
                  onViewImages={setDialogService}
                />
              ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-card-border bg-card-accent/5 py-12 text-center">
              <Search className="size-12 text-muted-foreground opacity-50" />
              <p className="mt-4 text-base font-medium text-card-text">Ingen tjenester funnet</p>
              <p className="mt-1 text-sm text-muted-foreground">Prøv et annet søkeord</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Tilbakestill søk
              </button>
            </div>
          )}
        </div>
      </BookingContainer>

      {/* ========================================
          STICKY FLOATING SUMMARY - Mobile
          ======================================== */}
      {hasSelections && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-card-border bg-background shadow-2xl md:hidden">
          <div className="p-3">
            {/* Summary */}
            <div className="mb-3 rounded-lg bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                    <ShoppingBag className="size-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {selectedServices.size} {selectedServices.size === 1 ? 'tjeneste' : 'tjenester'}
                    </p>
                    <p className="text-sm font-bold text-card-text">
                      {totalPrice} kr · {totalDuration} min
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedServices(new Set())}
                  className="text-xs font-medium text-destructive hover:underline"
                >
                  Fjern alle
                </button>
              </div>
            </div>

            {/* Continue button */}
            <Form method="post">
              {Array.from(selectedServices).map((serviceId) => (
                <input key={serviceId} type="hidden" name="serviceId" value={serviceId} />
              ))}
              <BookingButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                <Sparkles className="size-5" />
                Fortsett til tidspunkt
              </BookingButton>
            </Form>
          </div>
        </div>
      )}

      {/* ========================================
          DESKTOP SUMMARY SIDEBAR
          ======================================== */}
      {hasSelections && (
        <div className="sticky top-4 hidden rounded-lg border border-card-border bg-card p-4 md:block">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary">
              <ShoppingBag className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-base font-bold text-card-text">Valgte tjenester</h3>
              <p className="text-sm text-muted-foreground">
                {selectedServices.size} {selectedServices.size === 1 ? 'tjeneste' : 'tjenester'}
              </p>
            </div>
          </div>

          {/* Selected services list */}
          <div className="mb-4 space-y-2">
            {selectedServicesList.map((service) => (
              <div
                key={service.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-card-border bg-card-accent/5 p-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-card-text">{service.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {service.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="size-3" />
                      {service.price} kr
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className="shrink-0 rounded p-1 transition-colors hover:bg-destructive/10"
                >
                  <X className="size-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mb-4 rounded-lg bg-primary/5 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-card-text">Totalt</span>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{totalPrice} kr</p>
                <p className="text-xs text-muted-foreground">{totalDuration} min</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Form method="post">
              {Array.from(selectedServices).map((serviceId) => (
                <input key={serviceId} type="hidden" name="serviceId" value={serviceId} />
              ))}
              <BookingButton
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                <Sparkles className="size-4" />
                Fortsett til tidspunkt
              </BookingButton>
            </Form>

            <button
              type="button"
              onClick={() => setSelectedServices(new Set())}
              className="w-full text-center text-sm font-medium text-destructive hover:underline"
            >
              Fjern alle valg
            </button>
          </div>
        </div>
      )}

      {/* Spacer for mobile sticky summary */}
      {hasSelections && <div className="h-32 md:hidden" aria-hidden="true" />}

      {/* ========================================
          IMAGE DIALOG - Mobile-optimized
          ======================================== */}
      <Dialog open={dialogService !== null} onOpenChange={(open) => !open && setDialogService(null)}>
        <DialogContent className="max-w-3xl gap-0 p-0">
          {dialogService && (
            <>
              <DialogHeader className="border-b border-card-border p-4 md:p-6">
                <DialogTitle className="text-base font-bold text-card-text md:text-lg">
                  {dialogService.name}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
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
    </>
  );
}

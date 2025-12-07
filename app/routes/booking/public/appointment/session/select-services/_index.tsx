import { data, redirect, type LoaderFunctionArgs, Form, useLoaderData } from 'react-router';
import { useEffect, useState } from 'react';
import type { ApiClientError } from '~/api/clients/http';
import { getSession } from '~/lib/appointments.server';
import { bookingApi } from '~/lib/utils';
import { type ActionFunctionArgs } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '~/components/ui/carousel';
import type { AppointmentSessionDto, GroupedServiceGroupsDto } from '~/api/clients/types';
import type { GroupedServiceDto } from 'tmp/openapi/gen/booking';
import { ROUTES_MAP } from '~/lib/route-tree';

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

    return redirect(ROUTES_MAP['booking.public.appointment.select-time'].href);
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function BookingPublicAppointmentSessionSelectServicesRoute() {
  const { serviceGroups, session } = useLoaderData<AppointmentsSelectServicesLoaderData>();
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [dialogService, setDialogService] = useState<GroupedServiceDto | null>(null);

  useEffect(() => {
    if (session.selectedServices) {
      setSelectedServices(new Set(session.selectedServices));
    }
  }, [session]);

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

  const findService = (serviceId: number): GroupedServiceDto | undefined => {
    for (const group of serviceGroups) {
      const service = group.services.find((s) => s.id === serviceId);
      if (service) return service;
    }
    return undefined;
  };

  const getTotalDuration = () => {
    let total = 0;
    selectedServices.forEach((serviceId) => {
      const service = findService(serviceId);
      if (service) {
        total += service.duration;
      }
    });
    return total;
  };

  const getTotalPrice = () => {
    let total = 0;
    selectedServices.forEach((serviceId) => {
      const service = findService(serviceId);
      if (service) {
        total += service.price;
      }
    });
    return total;
  };

  const hasSelections = selectedServices.size > 0;

  return (
    <>
      <div className="space-y-5">
        <div className="border-b border-border pb-4">
          <h1 className="text-base font-semibold text-foreground">Velg tjenester</h1>
          <p className="text-[0.7rem] text-muted-foreground mt-1">Velg én eller flere tjenester.</p>
        </div>

        <div className="space-y-5">
          {serviceGroups
            .filter((group) => group.services.length > 0)
            .map((group) => (
              <div key={group.id} className="border border-border bg-background p-4 sm:p-5 space-y-4">
                <div className="border-b border-border pb-3">
                  <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {group.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.services.map((service) => {
                    const isSelected = selectedServices.has(service.id);
                    const hasImages = service.images && service.images.length > 0;

                    return (
                      <div key={service.id} className="border border-border bg-background p-4 space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-foreground">{service.price} kr</span>
                            <span className="text-xs text-muted-foreground">{service.duration} min</span>
                          </div>
                        </div>

                        {hasImages && (
                          <button
                            type="button"
                            onClick={() => setDialogService(service)}
                            className="px-0 text-[0.7rem] font-medium text-muted-foreground underline-offset-2 hover:underline"
                          >
                            Vis bilder
                          </button>
                        )}

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => toggleService(service.id)}
                            className={`w-full border border-border px-3 py-2 text-xs font-medium rounded-none ${
                              isSelected ? 'bg-background text-foreground' : 'bg-foreground text-background'
                            }`}
                          >
                            {isSelected ? 'Fjern' : 'Legg til'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {hasSelections && (
          <div className="border border-border bg-background p-4 sm:p-5 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Valgte tjenester
              </span>
              <div className="space-y-2">
                {Array.from(selectedServices).map((serviceId) => {
                  const service = findService(serviceId);
                  if (!service) return null;

                  return (
                    <div key={serviceId} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">{service.name}</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-muted-foreground">{service.duration} min</span>
                        <span className="text-sm font-medium text-foreground">{service.price} kr</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-foreground">Totalt</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">{getTotalDuration()} min</span>
                  <span className="text-base font-semibold text-foreground">{getTotalPrice()} kr</span>
                </div>
              </div>
            </div>

            <Form method="post" className="border-t border-border pt-4">
              {Array.from(selectedServices).map((serviceId) => (
                <input key={serviceId} type="hidden" name="serviceId" value={serviceId} />
              ))}
              <button
                type="submit"
                className="w-full border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none"
              >
                Fortsett til tidspunkt
              </button>
            </Form>
          </div>
        )}
      </div>

      <Dialog open={dialogService !== null} onOpenChange={(open) => !open && setDialogService(null)}>
        <DialogContent className="max-w-3xl rounded-none border border-border bg-background px-4 py-5 sm:px-6 sm:py-6">
          {dialogService && (
            <>
              <DialogHeader className="mb-3 border-b border-border pb-3">
                <DialogTitle className="text-sm font-medium text-foreground">{dialogService.name}</DialogTitle>
                <DialogDescription className="text-[0.8rem] text-muted-foreground">
                  Bilder for denne tjenesten
                </DialogDescription>
              </DialogHeader>

              {dialogService.images && dialogService.images.length > 0 && (
                <div className="border border-border bg-muted p-3">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {dialogService.images.map((image) => (
                        <CarouselItem key={image.id ?? image.url} className="flex justify-center">
                          <div className="w-full max-w-xl overflow-hidden border border-border bg-background">
                            <img
                              src={image.url}
                              alt={image.label || dialogService.name}
                              className="h-64 w-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {dialogService.images.length > 1 && (
                      <>
                        <CarouselPrevious className="border border-border bg-background rounded-none" />
                        <CarouselNext className="border border-border bg-background rounded-none" />
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

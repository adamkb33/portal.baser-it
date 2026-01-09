import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Form, useActionData } from 'react-router';
import { Button } from '~/components/ui/button';
import { CompanyUserContactController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/company.booking.appointments.create.route';
import { ContactSelector } from '../../_components/contact-selector';
import { ServicesSelector } from '../../_components/services-selector';
import {
  CompanyUserAppointmentController,
  CompanyUserBookingProfileController,
  CompanyUserScheduleController,
} from '~/api/generated/booking/sdk.gen';
import { Label } from '~/components/ui/label';
import type { ContactDto, GroupedServiceGroupDto } from '~/api/generated/booking';
import { DateTimeSelector } from '../../_components/date-time-selector';
import React from 'react';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import type { ApiClientError } from '~/api/clients/http';
import { formatISO, format } from 'date-fns';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const contactPage = parseInt(url.searchParams.get('contact-page') || '0', 10);
    const contactSize = parseInt(url.searchParams.get('contact-size') || '5', 10);
    const contactSearch = url.searchParams.get('contact-search') || '';
    const serviceSearch = url.searchParams.get('service-search') || '';

    const sessionParam = url.searchParams.get('appointment-session') || '';
    const serviceIdsMatch = sessionParam.match(/service_ids:(\d+(?:,\d+)*)/);
    const selectedServiceIds = serviceIdsMatch ? serviceIdsMatch[1].split(',').map(Number) : [];

    const apiResponses = await withAuth(request, async () => {
      const contactsResponse = await CompanyUserContactController.getContacts({
        query: {
          page: contactPage,
          size: contactSize,
          sort: 'familyName,asc',
          ...(contactSearch && { search: contactSearch }),
        },
      });

      const bookingProfileResponse = await CompanyUserBookingProfileController.getBookingProfile();

      let scheduleResponse = null;
      if (selectedServiceIds.length > 0) {
        scheduleResponse = await CompanyUserScheduleController.getSchedule({
          body: {
            selectedServiceIds,
          },
        });
      }

      return {
        contactsResponse,
        bookingProfileResponse,
        scheduleResponse,
      };
    });

    const contactsResponse = apiResponses.contactsResponse.data?.data;
    const bookingProfileResponse = apiResponses.bookingProfileResponse.data;
    const scheduleResponse = apiResponses.scheduleResponse?.data?.data;

    return {
      contacts: contactsResponse?.content || [],
      contactPagination: {
        page: contactsResponse?.page ?? 0,
        size: contactsResponse?.size ?? contactSize,
        totalElements: contactsResponse?.totalElements ?? 0,
        totalPages: contactsResponse?.totalPages ?? 1,
      },
      bookingProfile: bookingProfileResponse,
      schedules: scheduleResponse || [],
      contactSearch,
      serviceSearch,
    };
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    return {
      contacts: [],
      contactPagination: {
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 1,
      },
      bookingProfile: null,
      schedules: [],
      contactSearch: '',
      serviceSearch: '',
      error: error?.message || 'Kunne ikke hente data',
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const contactId = Number(formData.get('contactId'));
    const serviceIds = formData.get('serviceIds')?.toString().split(',').map(Number) || [];
    const startTime = formData.get('startTime')?.toString() || '';
    const response = await withAuth(request, async () => {
      return await CompanyUserAppointmentController.companyUserCreateAppointment({
        body: {
          contactId,
          serviceIds,
          startTime,
        },
      });
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body?.message || 'Kunne ikke opprette avtale' };
    }

    throw error;
  }
}

export default function CompanyBookingAppointmentsCreatePage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const { contacts, contactPagination, contactSearch, serviceSearch, schedules } = loaderData;
  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [filteredServices, setFilteredServices] = useState<GroupedServiceGroupDto[]>(
    loaderData.bookingProfile?.services || [],
  );

  useEffect(() => {
    if (actionData?.success) {
      navigate('/company/booking/appointments');
    }
  }, [actionData, navigate]);

  useEffect(() => {
    const sessionParam = searchParams.get('appointment-session');
    if (sessionParam && contacts.length > 0) {
      const contactMatch = sessionParam.match(/contact_id:(\d+)/);
      if (contactMatch) {
        const contactId = parseInt(contactMatch[1]);
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
          setSelectedContact(contact);
        }
      }

      const servicesMatch = sessionParam.match(/service_ids:(\d+(?:,\d+)*)/);
      if (servicesMatch) {
        const serviceIds = servicesMatch[1].split(',').map(Number);
        setSelectedServiceIds(serviceIds);
      }

      const dateTimeMatch = sessionParam.match(/datetime:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?/);
      if (dateTimeMatch) {
        const dateTimeStr = dateTimeMatch[1] + (dateTimeMatch[2] || ':00');
        const dateTime = new Date(dateTimeStr);
        setSelectedDateTime(formatISO(dateTime));
      }
    }
  }, [searchParams, contacts]);

  useEffect(() => {
    if (!loaderData.bookingProfile?.services) {
      setFilteredServices([]);
      return;
    }

    const services = loaderData.bookingProfile.services;
    if (!serviceSearch) {
      setFilteredServices(services);
      return;
    }

    const searchLower = serviceSearch.toLowerCase();
    const filtered = services
      .map((group) => ({
        ...group,
        services: group.services.filter((service) => service.name.toLowerCase().includes(searchLower)),
      }))
      .filter((group) => group.services.length > 0);
    setFilteredServices(filtered);
  }, [serviceSearch, loaderData.bookingProfile]);

  const updateSessionParams = (contactId?: number, serviceIds?: number[], dateTime?: string | null) => {
    const params = new URLSearchParams(searchParams);
    const parts: string[] = [];

    const finalContactId = contactId ?? selectedContact?.id;
    const finalServiceIds = serviceIds ?? selectedServiceIds;
    const finalDateTime = dateTime !== undefined ? dateTime : selectedDateTime;

    if (finalContactId) {
      parts.push(`contact_id:${finalContactId}`);
    }

    if (finalServiceIds.length > 0) {
      parts.push(`service_ids:${finalServiceIds.join(',')}`);
    }

    if (finalDateTime) {
      parts.push(`datetime:${finalDateTime}`);
    }

    if (parts.length > 0) {
      params.set('appointment-session', parts.join('|'));
    } else {
      params.delete('appointment-session');
    }

    navigate(`?${params.toString()}`, { replace: true, preventScrollReset: true });
  };

  const handleSelectContact = (contact: ContactDto) => {
    setSelectedContact(contact);
    updateSessionParams(contact.id, selectedServiceIds, selectedDateTime);
  };

  const handleSelectService = (serviceId: number) => {
    const newServiceIds = [...selectedServiceIds, serviceId];
    setSelectedServiceIds(newServiceIds);
    updateSessionParams(selectedContact?.id, newServiceIds, selectedDateTime);
  };

  const handleDeselectService = (serviceId: number) => {
    const newServiceIds = selectedServiceIds.filter((id) => id !== serviceId);
    setSelectedServiceIds(newServiceIds);
    updateSessionParams(selectedContact?.id, newServiceIds, selectedDateTime);
  };

  const handleSelectDateTime = (dateTime: Date) => {
    setSelectedDateTime(formatISO(dateTime));
    updateSessionParams(selectedContact?.id, selectedServiceIds, formatISO(dateTime));
  };

  const handleContactPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('contact-page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true, preventScrollReset: true });
  };

  const handleContactSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('contact-search', search);
    } else {
      params.delete('contact-search');
    }
    params.set('contact-page', '0');
    navigate(`?${params.toString()}`, { replace: true, preventScrollReset: true });
  };

  const handleServiceSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('service-search', search);
    } else {
      params.delete('service-search');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleCancel = () => {
    navigate('/company/booking/appointments');
  };

  const formatDateTime = (date: Date | string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Oslo',
    }).format(date instanceof Date ? date : new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}t ${mins}m`;
    if (hours > 0) return `${hours}t`;
    return `${mins}m`;
  };

  const getSelectedServices = () => {
    if (!loaderData.bookingProfile?.services) return [];

    return loaderData.bookingProfile.services.flatMap((group) =>
      group.services.filter((service) => selectedServiceIds.includes(service.id)),
    );
  };
  const selectedServices = getSelectedServices();
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);

  const isFormValid = selectedContact && selectedServiceIds.length > 0 && selectedDateTime;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-black">
        <h1 className="text-2xl font-bold tracking-tight">Bestill Ny Time</h1>
        <p className="text-xs mt-1">Opprett en ny timebestilling for en kunde.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1.5">
        {[
          { num: 1, label: 'Kontakt', active: true },
          { num: 2, label: 'Tjenester', active: !!selectedContact },
          { num: 3, label: 'Dato & Tid', active: selectedServiceIds.length > 0 },
        ].map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className={`flex items-center gap-1.5 ${step.active ? 'opacity-100' : 'opacity-30'}`}>
              <div
                className={`
                w-6 h-6 border-2 border-black flex items-center justify-center
                font-bold text-xs
                ${step.active ? 'bg-black text-white' : 'bg-white text-black'}
              `}
              >
                {step.num}
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
            </div>
            {idx < 2 && <div className="flex-1 h-px bg-black/20 min-w-4" />}
          </React.Fragment>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Step 1: Contact */}
        <div className="flex-1 space-y-2">
          <ContactSelector
            contacts={contacts}
            selectedContactId={selectedContact?.id || null}
            onSelectContact={handleSelectContact}
            pagination={contactPagination}
            onPageChange={handleContactPageChange}
            onSearchChange={handleContactSearchChange}
            initialSearch={contactSearch}
          />
        </div>

        {/* Step 2: Services */}
        <div
          className={`flex-1 space-y-2 transition-opacity ${selectedContact ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`
              w-6 h-6 border-2 border-black flex items-center justify-center font-bold text-xs shrink-0
              ${selectedContact ? 'bg-black text-white' : 'bg-white text-black'}
            `}
            >
              2
            </div>
            <Label className="text-sm font-bold">Velg tjenester</Label>
          </div>
          {selectedContact ? (
            loaderData.bookingProfile?.services.length ? (
              <ServicesSelector
                serviceGroups={filteredServices}
                selectedServiceIds={selectedServiceIds}
                onSelectService={handleSelectService}
                onDeselectService={handleDeselectService}
                onSearchChange={handleServiceSearchChange}
                initialSearch={serviceSearch}
              />
            ) : (
              <div className="border-2 border-black/20 p-6 text-center">
                <p className="text-xs font-medium">Ingen tjenester tilgjengelig i bookingprofilen.</p>
              </div>
            )
          ) : (
            <div className="border-2 border-dashed border-black/20 p-6 text-center">
              <p className="text-xs">Velg en kontakt for å fortsette</p>
            </div>
          )}
        </div>

        {/* Step 3: Date/Time */}
        <div
          className={`flex-1 space-y-2 transition-opacity ${selectedServiceIds.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`
              w-6 h-6 border-2 border-black flex items-center justify-center font-bold text-xs shrink-0
              ${selectedServiceIds.length > 0 ? 'bg-black text-white' : 'bg-white text-black'}
            `}
            >
              3
            </div>
            <Label className="text-sm font-bold">Velg dato og tid</Label>
          </div>
          {selectedServiceIds.length > 0 ? (
            <DateTimeSelector
              schedules={schedules}
              selectedDateTime={selectedDateTime ? new Date(selectedDateTime) : null}
              onSelectDateTime={handleSelectDateTime}
            />
          ) : (
            <div className="border-2 border-dashed border-black/20 p-6 text-center">
              <p className="text-xs">Velg tjenester for å fortsette</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {isFormValid && (
        <div className="border-2 border-black p-6 space-y-4 bg-muted/30">
          <h2 className="text-lg font-bold">Oppsummering</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <User className="h-4 w-4" />
                <span>Kunde</span>
              </div>
              <div className="pl-6">
                <p className="font-semibold">
                  {selectedContact.givenName} {selectedContact.familyName}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <Calendar className="h-4 w-4" />
                <span>Dato & Tid</span>
              </div>
              <div className="pl-6">
                <p className="font-semibold">{formatDateTime(selectedDateTime)}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
              <DollarSign className="h-4 w-4" />
              <span>Tjenester</span>
            </div>
            <div className="pl-6 space-y-2">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{service.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({formatDuration(service.duration)})</span>
                  </div>
                  <span className="font-semibold">{formatPrice(service.price)}</span>
                </div>
              ))}
              <div className="pt-2 border-t-2 border-black/20 flex items-center justify-between font-bold">
                <div className="flex items-center gap-2">
                  <span>Total</span>
                  <span className="text-xs font-normal text-muted-foreground">({formatDuration(totalDuration)})</span>
                </div>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {actionData?.error && (
        <div className="border-2 border-red-500 bg-red-50 p-4 text-sm text-red-900">
          <strong>Feil:</strong> {actionData.error}
        </div>
      )}

      {/* Actions */}
      <Form method="post" className="flex justify-between items-center gap-4 pt-4 border-t-2 border-black">
        <input type="hidden" name="contactId" value={selectedContact?.id || ''} />
        <input type="hidden" name="serviceIds" value={selectedServiceIds.join(',')} />
        <input type="hidden" name="startTime" value={selectedDateTime?.toString()} />

        <Button type="button" variant="outline" onClick={handleCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={!isFormValid} className="px-6">
          Opprett time
        </Button>
      </Form>
    </div>
  );
}

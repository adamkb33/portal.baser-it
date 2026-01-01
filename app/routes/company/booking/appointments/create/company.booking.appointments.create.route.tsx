import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '~/components/ui/button';
import { CompanyUserContactController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/company.booking.appointments.create.route';
import { ContactSelector } from '../../_components/contact-selector';
import { ServicesSelector } from '../../_components/services-selector';
import { CompanyUserBookingProfileController, CompanyUserScheduleController } from '~/api/generated/booking/sdk.gen';
import { Label } from '~/components/ui/label';
import type { ContactDto, GroupedServiceGroupDto, ServiceDto } from '~/api/generated/booking';
import { DateTimeSelector } from '../../_components/date-time-selector';
import React from 'react';

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

    const fromDateMatch = sessionParam.match(/from_date:(\d{4}-\d{2}-\d{2})/);
    const toDateMatch = sessionParam.match(/to_date:(\d{4}-\d{2}-\d{2})/);

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
            fromDate: fromDateMatch ? fromDateMatch[1] : undefined,
            toDate: toDateMatch ? toDateMatch[1] : undefined,
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

export default function CompanyBookingAppointmentsCreatePage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contacts, contactPagination, contactSearch, serviceSearch, schedules } = loaderData;
  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
  });
  const [filteredServices, setFilteredServices] = useState<GroupedServiceGroupDto[]>(
    loaderData.bookingProfile?.services || [],
  );

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

      const dateTimeMatch = sessionParam.match(/datetime:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
      if (dateTimeMatch) {
        const dateTimeStr = dateTimeMatch[1];
        const dateTime = new Date(dateTimeStr);
        setSelectedDateTime(dateTime);
      }

      const fromDateMatch = sessionParam.match(/from_date:(\d{4}-\d{2}-\d{2})/);
      const toDateMatch = sessionParam.match(/to_date:(\d{4}-\d{2}-\d{2})/);
      if (fromDateMatch && toDateMatch) {
        setDateRange({
          from: new Date(fromDateMatch[1]),
          to: new Date(toDateMatch[1]),
        });
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
    const filtered = services.filter((service) => service.name.toLowerCase().includes(searchLower));
    setFilteredServices(filtered);
  }, [serviceSearch, loaderData.bookingProfile]);

  const updateSessionParams = (
    contactId?: number,
    serviceIds?: number[],
    dateTime?: Date | null,
    newDateRange?: { from: Date; to: Date },
  ) => {
    const params = new URLSearchParams(searchParams);
    const parts: string[] = [];

    const finalContactId = contactId ?? selectedContact?.id;
    const finalServiceIds = serviceIds ?? selectedServiceIds;
    const finalDateTime = dateTime !== undefined ? dateTime : selectedDateTime;
    const finalDateRange = newDateRange ?? dateRange;

    if (finalContactId) {
      parts.push(`contact_id:${finalContactId}`);
    }

    if (finalServiceIds.length > 0) {
      parts.push(`service_ids:${finalServiceIds.join(',')}`);
    }

    if (finalDateTime) {
      parts.push(`datetime:${finalDateTime}`);
    }

    // Add date range
    const fromDateStr = finalDateRange.from.toISOString().split('T')[0];
    const toDateStr = finalDateRange.to.toISOString().split('T')[0];
    parts.push(`from_date:${fromDateStr}`);
    parts.push(`to_date:${toDateStr}`);

    if (parts.length > 0) {
      params.set('appointment-session', parts.join('|'));
    } else {
      params.delete('appointment-session');
    }

    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleSelectContact = (contact: ContactDto) => {
    setSelectedContact(contact);
    updateSessionParams(contact.id, selectedServiceIds, selectedDateTime, dateRange);
  };

  const handleSelectService = (serviceId: number) => {
    const newServiceIds = [...selectedServiceIds, serviceId];
    setSelectedServiceIds(newServiceIds);
    updateSessionParams(selectedContact?.id, newServiceIds, selectedDateTime, dateRange);
  };

  const handleDeselectService = (serviceId: number) => {
    const newServiceIds = selectedServiceIds.filter((id) => id !== serviceId);
    setSelectedServiceIds(newServiceIds);
    updateSessionParams(selectedContact?.id, newServiceIds, selectedDateTime, dateRange);
  };

  const handleSelectDateTime = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    updateSessionParams(selectedContact?.id, selectedServiceIds, dateTime, dateRange);
  };

  const handleDateRangeChange = (from: Date, to: Date) => {
    const newDateRange = { from, to };
    setDateRange(newDateRange);
    updateSessionParams(selectedContact?.id, selectedServiceIds, selectedDateTime, newDateRange);
  };

  const handleContactPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('contact-page', newPage.toString());
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleContactSearchChange = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('contact-search', search);
    } else {
      params.delete('contact-search');
    }
    params.set('contact-page', '0');
    navigate(`?${params.toString()}`, { replace: true });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b-2 border-black">
        <h1 className="text-2xl font-bold tracking-tight">Bestill Ny Time</h1>
        <p className="text-xs mt-1">Opprett en ny timebestilling for en kunde.</p>
      </div>

      {/* Progress Steps - Compact */}
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

      {/* Main Content - Responsive Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Step 1: Contact */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-black bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <Label className="text-sm font-bold">Velg kontakt</Label>
          </div>
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
              selectedDateTime={selectedDateTime}
              onSelectDateTime={handleSelectDateTime}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          ) : (
            <div className="border-2 border-dashed border-black/20 p-6 text-center">
              <p className="text-xs">Velg tjenester for å fortsette</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Compact Footer */}
      <div className="flex justify-between items-center gap-4 pt-4 border-t-2 border-black">
        <Button variant="outline" onClick={handleCancel}>
          Avbryt
        </Button>
        <Button disabled={!selectedContact || selectedServiceIds.length === 0 || !selectedDateTime} className="px-6">
          Fortsett til bekreftelse
        </Button>
      </div>
    </div>
  );
}

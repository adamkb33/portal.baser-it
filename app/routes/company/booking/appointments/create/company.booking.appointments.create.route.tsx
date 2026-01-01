import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import { Button } from '~/components/ui/button';
import { CompanyUserContactController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/company.booking.appointments.create.route';
import { ContactSelector } from '../../_components/contact-selector';
import { CompanyUserBookingProfileController, CompanyUserBookingController } from '~/api/generated/booking/sdk.gen';
import { Label } from '~/components/ui/label';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const contactPage = parseInt(url.searchParams.get('contact-page') || '0', 10);
    const contactSize = parseInt(url.searchParams.get('contact-size') || '5', 10);
    const contactSearch = url.searchParams.get('contact-search') || '';

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

      return {
        contactsResponse,
        bookingProfileResponse,
      };
    });

    const contactsResponse = apiResponses.contactsResponse.data?.data;
    const bookingProfileResponse = apiResponses.bookingProfileResponse.data;

    return {
      contacts: contactsResponse?.content || [],
      contactPagination: {
        page: contactsResponse?.page ?? 0,
        size: contactsResponse?.size ?? contactSize,
        totalElements: contactsResponse?.totalElements ?? 0,
        totalPages: contactsResponse?.totalPages ?? 1,
      },
      bookingProfile: bookingProfileResponse,
      contactSearch,
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
      contactSearch: '',
      error: error?.message || 'Kunne ikke hente kontakter',
    };
  }
}

export default function CompanyBookingAppointmentsCreatePage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contacts, contactPagination, contactSearch } = loaderData;
  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null);

  useEffect(() => {
    const sessionParam = searchParams.get('appointment-session');
    if (sessionParam && contacts.length > 0) {
      const match = sessionParam.match(/contact_id:(\d+)/);
      if (match) {
        const contactId = parseInt(match[1]);
        const contact = contacts.find((c) => c.id === contactId);
        if (contact) {
          setSelectedContact(contact);
        }
      }
    }
  }, [searchParams, contacts]);

  const handleSelectContact = (contact: ContactDto) => {
    setSelectedContact(contact);
    const params = new URLSearchParams(searchParams);
    if (contact.id) {
      params.set('appointment-session', `contact_id:${contact.id}`);
    }
    navigate(`?${params.toString()}`, { replace: true });
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
    params.set('contact-page', '0'); // Reset to first page on search
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleCancel = () => {
    navigate('/company/booking/appointments');
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Bestill Ny Time</h1>
        <p className="text-sm text-muted-foreground">Opprett en ny timebestilling for en kunde.</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">1. Velg kontakt</Label>
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

        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium">2. Velg tjenester</Label>
          {selectedContact ? (
            <div className="border rounded-md p-8 text-center text-muted-foreground">Tjeneste-valg kommer her...</div>
          ) : (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              Velg en kontakt for å fortsette
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-4 pt-6 mt-6 border-t">
        <Button variant="outline" onClick={handleCancel}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

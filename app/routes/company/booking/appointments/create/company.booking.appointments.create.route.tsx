import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { ContactDto } from 'tmp/openapi/gen/base';
import { Button } from '~/components/ui/button';
import { CompanyUserContactController } from '~/api/generated/identity';
import { withAuth } from '~/api/utils/with-auth';
import type { Route } from './+types/company.booking.appointments.create.route';
import { ContactSelector } from '../../_components/contact-selector';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const contactPage = parseInt(url.searchParams.get('contact-page') || '0', 10);
    const contactSize = parseInt(url.searchParams.get('contact-size') || '10', 10);
    const contactSearch = url.searchParams.get('contact-search') || '';

    const contactsResponse = await withAuth(request, async () => {
      return CompanyUserContactController.getContacts({
        query: {
          page: contactPage,
          size: contactSize,
          sort: 'familyName,asc',
          ...(contactSearch && { search: contactSearch }),
        },
      });
    });

    const apiResponse = contactsResponse?.data?.data;

    return {
      contacts: apiResponse?.content || [],
      contactPagination: {
        page: apiResponse?.page ?? 0,
        size: apiResponse?.size ?? contactSize,
        totalElements: apiResponse?.totalElements ?? 0,
        totalPages: apiResponse?.totalPages ?? 1,
      },
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

  // Parse appointment session from URL
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
    <div className="">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Bestill Ny Time</h1>
        <p className="text-sm text-muted-foreground">Opprett en ny timebestilling for en kunde.</p>
      </div>

      <div className="md:col-span-1">
        <div className="space-y-2">
          <label className="text-sm font-medium">1. Velg kontakt</label>
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
      </div>

      <div className="md:col-span-2">
        {selectedContact ? (
          <div className="space-y-4">
            <div className="text-sm font-medium">2. Velg tjenester</div>
            <div className="border rounded-md p-8 text-center text-muted-foreground">Tjeneste-valg kommer her...</div>
          </div>
        ) : (
          <div className="border rounded-md p-8 text-center text-muted-foreground">Velg en kontakt for å fortsette</div>
        )}
      </div>

      <div className="flex justify-between gap-4 pt-6 mt-6 border-t">
        <Button variant="outline" onClick={handleCancel}>
          Avbryt
        </Button>
        <Button disabled={!selectedContact}>Neste</Button>
      </div>
    </div>
  );
}

import { data, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import { Check, MapPin } from 'lucide-react';
import type { CompanySummaryDto } from 'tmp/openapi/gen/base';
import { baseApi, bookingApi } from '~/lib/utils';
import type { ApiClientError } from '~/api/clients/http';
import { BookingContainer, BookingSection, BookingStepList, BookingButton } from '../_components/booking-layout';

export type BookingPublicAppointmentSessionSuccessRouteLoaderData = {
  companySummary: CompanySummaryDto;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    if (!companyId) {
      throw Error('Selskap ikke gjenkjent');
    }

    await bookingApi().AppointmentsControllerService.AppointmentsControllerService.validateCompanyBooking({
      companyId: parseInt(companyId),
    });

    const companyResponse =
      await baseApi().PublicCompanyControllerService.PublicCompanyControllerService.publicGetCompanyById({
        companyId: parseInt(companyId),
      });

    if (!companyResponse.data) {
      throw Error('Selskap ikke funnet');
    }

    return data<BookingPublicAppointmentSessionSuccessRouteLoaderData>({
      companySummary: companyResponse.data,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function BookingPublicAppointmentSessionSuccessRoute() {
  const { companySummary } = useLoaderData<BookingPublicAppointmentSessionSuccessRouteLoaderData>();

  const formatAddress = () => {
    const address = companySummary.businessAddress;
    if (!address) return null;

    const parts = [
      ...(address.addressLines || []),
      address.postalCode && address.city ? `${address.postalCode} ${address.city}` : address.city,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  };

  const getGoogleMapsUrl = () => {
    const address = companySummary.businessAddress;
    if (!address) return null;

    const query = [...(address.addressLines || []), address.postalCode, address.city, address.country]
      .filter(Boolean)
      .join(' ');

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const formattedAddress = formatAddress();
  const mapsUrl = getGoogleMapsUrl();

  return (
    <BookingContainer>
      <BookingSection>
        <div className="flex items-center gap-2">
          <div className="border border-border bg-foreground p-2">
            <Check className="h-5 w-5 text-background" strokeWidth={2} />
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Bekreftelse</span>
        </div>
        <h1 className="text-base font-semibold text-foreground">Din time er bekreftet</h1>
        <p className="text-sm text-foreground">
          Vi har mottatt din timebestilling og sender deg en bekreftelse på e-post innen kort tid. Du vil motta en
          påminnelse før timen din.
        </p>
      </BookingSection>

      <BookingSection label="Møtested">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{companySummary.name || 'Ukjent selskap'}</h2>
          {formattedAddress && <p className="text-sm text-muted-foreground">{formattedAddress}</p>}
        </div>
      </BookingSection>

      {companySummary.businessAddress && (
        <BookingSection variant="muted" label="Adresse">
          <div className="space-y-1">
            {companySummary.businessAddress.addressLines?.map((line, idx) => (
              <p key={idx} className="text-sm text-foreground">
                {line}
              </p>
            ))}
            {(companySummary.businessAddress.postalCode || companySummary.businessAddress.city) && (
              <p className="text-sm text-foreground">
                {[companySummary.businessAddress.postalCode, companySummary.businessAddress.city]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            )}
            {companySummary.businessAddress.country && (
              <p className="text-sm text-foreground">{companySummary.businessAddress.country}</p>
            )}
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border bg-foreground text-background px-3 py-2 text-xs font-medium rounded-none hover:bg-foreground/90"
            >
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              Åpne i Google Maps
            </a>
          )}
        </BookingSection>
      )}

      {/* Next steps */}
      <BookingSection label="Hva skjer nå?">
        <BookingStepList
          steps={[
            {
              title: 'Du mottar en bekreftelse',
              description: 'Vi sender deg en e-post med alle detaljer om timen din',
            },
            {
              title: 'Du får en påminnelse',
              description: 'Vi sender deg en påminnelse dagen før timen din',
            },
            {
              title: 'Møt opp til avtalt tid',
              description: 'Husk å møte opp i god tid på angitt adresse',
            },
          ]}
        />
      </BookingSection>

      {/* CTA */}
      <BookingSection>
        <a href="/">
          <BookingButton variant="outline">Tilbake til forsiden</BookingButton>
        </a>
      </BookingSection>
    </BookingContainer>
  );
}

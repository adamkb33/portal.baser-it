import { Suspense, lazy, useEffect, useState } from 'react';
import { data, Link } from 'react-router';
import type { Route } from './+types/booking.public.appointment.route';
import { AppointmentsController, type CompanySummaryDto } from '~/api/generated/booking';
import { ROUTES_MAP } from '~/lib/route-tree';
import { resolveErrorPayload } from '~/lib/api-error';
import {
  BookingContainer,
  BookingErrorBanner,
  BookingGrid,
  BookingPageHeader,
  BookingSection,
} from './_components/booking-layout';

const CompaniesMap = lazy(() => import('~/components/booking/companies-map.client'));

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const response = await AppointmentsController.getBookingReadyCompanies();
    const companies = response.data?.data ?? [];

    if (!response.data?.data) {
      const message = response.data?.message || 'Kunne ikke hente timebestillinger';
      return data({ companies: [], error: message }, { status: 400 });
    }

    return data({ companies, error: null as string | null });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente timebestillinger');
    return data({ companies: [], error: message }, { status: status ?? 400 });
  }
}

function getCompanyLocation(company: CompanySummaryDto): string | null {
  const address = company.businessAddress || company.postalAddress;
  const parts = [address?.city, address?.municipality, address?.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function AppointmentsRoute({ loaderData }: Route.ComponentProps) {
  const companies = loaderData.companies ?? [];
  const error = loaderData.error ?? null;
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setShowMap(true);
  }, []);

  return (
    <BookingContainer>
      <BookingPageHeader
        label="Bestill time"
        title="Velg bedrift"
        description="Velg en bedrift for å starte timebestilling."
      />

      {error && <BookingErrorBanner message={error} sticky />}

      {companies.length > 0 && (
        <BookingSection title="Kart">
          {showMap ? (
            <Suspense
              fallback={
                <div className="flex h-72 items-center justify-center rounded-lg border border-card-border bg-card text-sm text-muted-foreground">
                  Laster kart...
                </div>
              }
            >
              <CompaniesMap companies={companies} />
            </Suspense>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-lg border border-card-border bg-card text-sm text-muted-foreground">
              Laster kart...
            </div>
          )}
        </BookingSection>
      )}

      <BookingSection title="Tilgjengelige bedrifter">
        {companies.length === 0 ? (
          <div className="rounded-lg border border-card-border bg-card-muted-bg p-4 text-sm text-muted-foreground">
            Ingen bedrifter er klare for booking akkurat nå.
          </div>
        ) : (
          <BookingGrid cols={2}>
            {companies.map((company) => {
              const location = getCompanyLocation(company);
              const companyName = company.name || `Selskap ${company.orgNumber}`;
              const startUrl = `${ROUTES_MAP['booking.public.appointment.session'].href}?companyId=${company.id}`;

              return (
                <Link
                  key={company.id}
                  to={startUrl}
                  className="group flex h-full flex-col rounded-lg border border-card-border bg-card p-4 transition hover:border-primary/40 hover:bg-card-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Org.nr. {company.orgNumber}
                    </div>
                    <h2 className="text-base font-semibold text-card-text md:text-lg">{companyName}</h2>
                    {company.organizationType?.description && (
                      <p className="text-xs text-muted-foreground md:text-sm">
                        {company.organizationType.description}
                      </p>
                    )}
                    {location && <p className="text-xs text-muted-foreground md:text-sm">{location}</p>}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-primary">
                    <span>Start booking</span>
                    <span className="transition group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              );
            })}
          </BookingGrid>
        )}
      </BookingSection>
    </BookingContainer>
  );
}
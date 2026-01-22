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

type CompanyLocation = {
  company: CompanySummaryDto;
  lat: number;
  lon: number;
};

const MAX_GEOCODE = 12;
const GEO_DELAY_MS = 150;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCompanyQuery = (company: CompanySummaryDto): string | null => {
  const address = company.businessAddress || company.postalAddress;

  if (!address) {
    return company.name ? `${company.name}, Norway` : null;
  }

  const street = address.addressLines?.join(' ') || '';
  const city = address.city || address.municipality || '';
  const postalcode = address.postalCode || '';
  const country = address.country ?? address.countryCode ?? 'Norway';

  if (!street && !city && !postalcode) {
    return company.name ? `${company.name}, ${country}` : null;
  }

  return [street, postalcode, city, country].filter(Boolean).join(', ');
};

async function geocodeCompanies(companies: CompanySummaryDto[]): Promise<CompanyLocation[]> {
  const limitedCompanies = companies.slice(0, MAX_GEOCODE);
  if (companies.length > MAX_GEOCODE) {
    console.debug('[companies-map] geocode limit reached', {
      totalCompanies: companies.length,
      maxGeocode: MAX_GEOCODE,
    });
  }

  const locations: CompanyLocation[] = [];

  for (const company of limitedCompanies) {
    const query = buildCompanyQuery(company);
    if (!query) {
      console.warn('[companies-map] missing address info for company', {
        id: company.id,
        name: company.name,
        orgNumber: company.orgNumber,
        businessAddress: company.businessAddress,
        postalAddress: company.postalAddress,
      });
      continue;
    }

    try {
      const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        countrycodes: 'no',
        q: query,
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          'Accept-Language': 'no',
          'User-Agent': 'baser-it-booking-map/1.0',
        },
      });

      if (!response.ok) {
        console.warn('[companies-map] geocode request failed', {
          id: company.id,
          name: company.name,
          status: response.status,
          statusText: response.statusText,
          query,
        });
        continue;
      }

      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) {
        console.warn('[companies-map] geocode returned no results', {
          id: company.id,
          name: company.name,
          query,
        });
        continue;
      }

      locations.push({
        company,
        lon: Number(data[0].lon),
        lat: Number(data[0].lat),
      });
    } catch (error) {
      console.warn('[companies-map] geocode request threw', {
        id: company.id,
        name: company.name,
        query,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (GEO_DELAY_MS > 0) {
      await sleep(GEO_DELAY_MS);
    }
  }

  console.debug('[companies-map] geocode results', {
    count: locations.length,
    results: locations.map((item) => ({
      id: item.company.id,
      name: item.company.name,
      lat: item.lat,
      lon: item.lon,
    })),
  });

  return locations;
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const response = await AppointmentsController.getBookingReadyCompanies();
    const companies = response.data?.data ?? [];
    console.debug('[companies-map] booking-ready companies', {
      count: companies.length,
      sample: companies.slice(0, 5).map((company) => ({
        id: company.id,
        name: company.name,
        orgNumber: company.orgNumber,
        businessAddress: company.businessAddress,
        postalAddress: company.postalAddress,
      })),
    });

    if (!response.data?.data) {
      const message = response.data?.message || 'Kunne ikke hente timebestillinger';
      console.warn('[companies-map] missing data payload', {
        message,
        status: response.status,
      });
      return data({ companies: [], locations: [], error: message }, { status: 400 });
    }

    const locations = await geocodeCompanies(companies);
    console.debug('[companies-map] geocode summary', {
      companyCount: companies.length,
      locationCount: locations.length,
    });
    return data({ companies, locations, error: null as string | null });
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke hente timebestillinger');
    console.error('[companies-map] loader failed', {
      message,
      status,
    });
    return data({ companies: [], locations: [], error: message }, { status: status ?? 400 });
  }
}

function getCompanyLocation(company: CompanySummaryDto): string | null {
  const address = company.businessAddress || company.postalAddress;
  const parts = [address?.city, address?.municipality, address?.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function AppointmentsRoute({ loaderData }: Route.ComponentProps) {
  const companies = loaderData.companies ?? [];
  const locations = loaderData.locations ?? [];
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
              <CompaniesMap locations={locations} />
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
              const companyName = company.name || `Selskap ${company.orgNumber}`;
              const startUrl = `${ROUTES_MAP['booking.public.appointment.session'].href}?companyId=${company.id}`;

              return (
                <Link
                  key={company.id}
                  to={startUrl}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-button-primary-border bg-button-primary-bg px-4 py-3 text-sm font-semibold text-button-primary-text transition hover:bg-button-primary-hover-bg hover:text-button-primary-hover-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={`Start booking hos ${companyName}`}
                >
                  <span>{companyName}</span>
                  <span className="text-base">→</span>
                </Link>
              );
            })}
          </BookingGrid>
        )}
      </BookingSection>
    </BookingContainer>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { CompanySummaryDto } from '~/api/generated/booking';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

type CompanyLocation = {
  company: CompanySummaryDto;
  lat: number;
  lon: number;
};

type CompaniesMapProps = {
  companies: CompanySummaryDto[];
};

const DEFAULT_CENTER: [number, number] = [59.9139, 10.7522];
const MAX_GEOCODE = 12;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const buildCompanyQuery = (company: CompanySummaryDto): string | null => {
  const address = company.businessAddress || company.postalAddress;

  if (!address) {
    return company.name ? `${company.name}, Norway` : null;
  }

  const parts = [
    company.name,
    ...(address.addressLines ?? []),
    address.postalCode,
    address.city,
    address.municipality,
    address.country ?? address.countryCode ?? 'Norway',
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : null;
};

const getCompanyLocationLabel = (company: CompanySummaryDto): string => {
  const address = company.businessAddress || company.postalAddress;
  const parts = [
    address?.addressLines?.join(' '),
    address?.postalCode,
    address?.city,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Ukjent adresse';
};

export default function CompaniesMap({ companies }: CompaniesMapProps) {
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadLocations = async () => {
      setIsLoading(true);
      try {
        const queries = companies
          .slice(0, MAX_GEOCODE)
          .map((company) => ({ company, query: buildCompanyQuery(company) }))
          .filter((item): item is { company: CompanySummaryDto; query: string } => Boolean(item.query));

        const results = await Promise.all(
          queries.map(async ({ company, query }) => {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=no&q=${encodeURIComponent(query)}`,
              { signal: controller.signal, headers: { 'Accept-Language': 'no' } },
            );

            if (!response.ok) return null;
            const data = (await response.json()) as Array<{ lat: string; lon: string }>;
            if (!data.length) return null;

            return {
              company,
              lat: Number(data[0].lat),
              lon: Number(data[0].lon),
            };
          }),
        );

        if (isActive) {
          setLocations(results.filter(Boolean) as CompanyLocation[]);
        }
      } catch {
        if (isActive) {
          setLocations([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [companies]);

  const center = useMemo<[number, number]>(() => {
    if (!locations.length) return DEFAULT_CENTER;
    const total = locations.reduce(
      (acc, item) => {
        acc.lat += item.lat;
        acc.lon += item.lon;
        return acc;
      },
      { lat: 0, lon: 0 },
    );
    return [total.lat / locations.length, total.lon / locations.length];
  }, [locations]);

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-card-border bg-card text-sm text-muted-foreground">
        Laster kart...
      </div>
    );
  }

  if (!locations.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-card-border bg-card-muted-bg text-sm text-muted-foreground">
        Fant ingen adresser som kunne vises på kartet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-card-border bg-card">
      <MapContainer center={center} zoom={6} className="h-72 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((item) => (
          <Marker key={item.company.id} position={[item.lat, item.lon]}>
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{item.company.name ?? `Selskap ${item.company.orgNumber}`}</div>
                <div className="text-xs text-muted-foreground">{getCompanyLocationLabel(item.company)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

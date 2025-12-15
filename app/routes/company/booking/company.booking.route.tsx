import { PageHeader } from '../_components/page-header';

export default function CompanyBookingPage() {
  return (
    <div className="">
      <PageHeader
        title="Booking"
        description="Administrer timebestillinger, tjenester og kundeopplevelser. Her kan du styre alle bookingfunksjoner for ditt selskap."
      />
      <div className="mt-4">
        <p className="text-muted-foreground">
          Velkommen til booking-modulen. Velg en kategori fra menyen for å komme i gang.
        </p>
      </div>
    </div>
  );
}

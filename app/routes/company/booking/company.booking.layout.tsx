import { Link, Outlet } from 'react-router';

import type { ApiClientError } from '~/api/clients/http';
import type { Route } from './+types/company.booking.layout';
import { bookingServiceApi } from '~/lib/utils';
import { ROUTES_MAP } from '~/lib/route-tree';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const bookingClient = await bookingServiceApi(request);
    const bookingInfoResponse =
      await bookingClient.CompanyUserBookingControllerService.CompanyUserBookingControllerService.getCompanyBookingInfo();

    return { bookingInfo: bookingInfoResponse };
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function CompanyBookingLayout({ loaderData }: Route.ComponentProps) {
  const data = loaderData.bookingInfo?.data;

  const missingItems: Array<{ label: string; link: string }> = [];
  if (data) {
    if (data.bookingProfilesAmount < 1)
      missingItems.push({ label: 'bookingprofiler', link: ROUTES_MAP['company.booking.profile'].href });
    if (data.bookingProfileServicesAmount < 1)
      missingItems.push({ label: 'profiltjenester', link: ROUTES_MAP['company.booking.profile'].href });
    if (data.bookingProfileDailySchedulesAmount < 1)
      missingItems.push({ label: 'dagsplaner', link: ROUTES_MAP['company.booking.profile'].href });
    if (data.serviceGroupsAmount < 1)
      missingItems.push({ label: 'tjenestegrupper', link: ROUTES_MAP['company.booking.admin.service-groups'].href });
    if (data.servicesAmount < 1)
      missingItems.push({ label: 'tjenester', link: ROUTES_MAP['company.booking.admin.service-groups.services'].href });
  }

  const showWarning = missingItems.length > 0;

  return (
    <>
      {showWarning && (
        <div className="border border-border bg-muted p-4 sm:p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-foreground text-lg">⚠</div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">
                Bookingsystemet er ikke operativt
              </p>
              <p className="text-[0.7rem] text-muted-foreground mb-2">Du mangler følgende:</p>
              <div className="flex flex-wrap gap-2">
                {missingItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.link}
                    className="border border-border bg-background text-foreground px-3 py-2 text-xs font-medium rounded-none hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loaderData.error && (
        <div className="border border-border bg-destructive/10 p-4 mb-4">
          <p className="text-xs text-destructive">{loaderData.error}</p>
        </div>
      )}

      <Outlet />
    </>
  );
}

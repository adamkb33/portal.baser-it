// routes/booking-profile.tsx
import { data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';
import type { CompanyUserProfileDto, UserDto } from '~/api/clients/types';
import { getAccessToken } from '~/lib/auth.utils';
import { baseApi, bookingApi } from '~/lib/utils';

export type BookingProfileLoaderData = {
  user?: UserDto;
  bookingProfile?: CompanyUserProfileDto;
  error?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const accesToken = await getAccessToken(request);
    if (!accesToken) {
      return redirect('/');
    }

    const userResponse = await baseApi(accesToken).UserControllerService.UserControllerService.getAuthenticatedUser();

    const bookingProfileResponse =
      await bookingApi(accesToken).BookingProfileControllerService.BookingProfileControllerService.getBookingProfile();

    return data<BookingProfileLoaderData>({
      user: userResponse.data as UserDto,
      bookingProfile: bookingProfileResponse as CompanyUserProfileDto,
    });
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    const apiError = error as ApiClientError;

    if (apiError?.body?.message) {
      return data<BookingProfileLoaderData>({
        error: apiError.body.message,
      });
    }

    throw error;
  }
}

export default function BookingProfilePage() {
  const { user, bookingProfile, error } = useLoaderData() as BookingProfileLoaderData;

  const initials = (user?.givenName?.[0] ?? '').toUpperCase() + (user?.familyName?.[0] ?? '').toUpperCase();

  const hasProfileImage = Boolean(bookingProfile?.imageId);
  const hasDescription = Boolean(bookingProfile?.description?.trim());

  return (
    <main className="min-h-[60vh] w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* PAGE HEADER */}
        <header className="border border-border bg-background p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Booking profile
              </span>
              <h1 className="text-base font-semibold text-foreground">Your details</h1>
              <p className="text-[0.8rem] text-muted-foreground">
                This is what we&apos;ll use for confirmations and receipts.
              </p>
            </div>

            {user && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex h-12 w-12 items-center justify-center border border-border bg-muted text-sm font-semibold leading-none">
                  {initials || '??'}
                </div>
                <span className="text-[0.7rem] text-muted-foreground">ID: {user.id}</span>
              </div>
            )}
          </div>
        </header>

        {/* ERROR STATE */}
        {error && (
          <section className="border border-border bg-muted p-3 sm:p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Error</p>
            <p className="text-[0.8rem] text-foreground">We couldn&apos;t load your profile right now.</p>
            <p className="text-[0.7rem] text-muted-foreground">{error}</p>
          </section>
        )}

        {/* USER PROFILE CARD */}
        {user && (
          <section className="border border-border bg-background p-4 sm:p-5 space-y-5">
            {/* Basic info */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Name</p>
                <p className="text-sm font-semibold text-foreground">
                  {user.givenName} {user.familyName}
                </p>
                <p className="text-[0.7rem] text-muted-foreground">Shown on bookings and receipts.</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-[0.7rem] text-muted-foreground">Where we&apos;ll send confirmations and updates.</p>
              </div>
            </div>

            {/* Meta row */}
            <div className="border-t border-border pt-4 flex flex-wrap gap-2.5">
              <span className="rounded-none border border-border bg-background px-2.5 py-0.5 text-[0.7rem] font-medium">
                User #{user.id}
              </span>
              <span className="border border-border px-2 py-0.5 text-xs text-muted-foreground">Authenticated</span>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                className="border border-border bg-foreground px-3 py-2 text-xs font-medium text-background rounded-none"
              >
                Edit details
              </button>
              <button
                type="button"
                className="px-0 text-[0.7rem] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Use a different account
              </button>
            </div>
          </section>
        )}

        {/* COMPANY BOOKING PROFILE CARD */}
        {bookingProfile && (
          <section className="border border-border bg-background p-4 sm:p-5 space-y-5">
            {/* Header row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Public booking profile
                </p>
                <p className="text-sm font-semibold text-foreground">How you appear to the company</p>
                <p className="text-[0.7rem] text-muted-foreground">
                  This description and image are visible to company staff when they manage your bookings.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {/* Image status pill */}
                <span className="border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {hasProfileImage ? 'Profile image set' : 'No profile image'}
                </span>

                {/* Simple brutalist image placeholder */}
                <div className="border border-border bg-muted px-3 py-4 text-[0.7rem] text-muted-foreground leading-snug">
                  {hasProfileImage ? (
                    <>
                      Image #{bookingProfile.imageId}
                      <br />
                      (shown inside company tools)
                    </>
                  ) : (
                    <>
                      No image uploaded.
                      <br />
                      You&apos;ll appear with initials only.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description block */}
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Description</p>

              <div className="border border-border bg-muted p-3 sm:p-4">
                {hasDescription ? (
                  <p className="text-[0.8rem] text-foreground leading-relaxed">{bookingProfile.description}</p>
                ) : (
                  <p className="text-[0.8rem] text-muted-foreground">
                    No description added yet. You can use this space to tell the company anything relevant about your
                    preferences, access needs, or recurring notes.
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                className="border border-border bg-background px-3 py-2 text-xs font-medium text-foreground rounded-none"
              >
                Edit booking profile
              </button>
              <button
                type="button"
                className="px-0 text-[0.7rem] font-medium text-muted-foreground underline-offset-2 hover:underline"
              >
                Reset description
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

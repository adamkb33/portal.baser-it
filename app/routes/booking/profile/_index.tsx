import { data, redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { useState } from 'react';
import type { ApiClientError } from '~/api/clients/http';
import type { CompanyUserProfileDto, UserDto } from '~/api/clients/types';
import { getAccessToken } from '~/lib/auth.utils';
import { baseApi, bookingApi } from '~/lib/utils';
import { FormDialog } from '~/components/dialog/form-dialog';
import { EmptyBookingProfile } from '~/routes/booking/profile/components/booking-profile-placeholder';
import { BookingProfileCard } from '~/routes/booking/profile/components/booking-profile-card';
import { PageHeader } from './components/page-header';
import { ErrorMessage } from '~/components/errors/error-messages';
import { UserProfileCard } from '~/components/cards/user-card';

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    imageId: null as number | null,
  });

  const initials = (user?.givenName?.[0] ?? '').toUpperCase() + (user?.familyName?.[0] ?? '').toUpperCase();

  const handleFieldChange = (name: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Creating booking profile:', formData);
    setCreateDialogOpen(false);
  };

  const handleEditDetails = () => {
    console.log('Edit details clicked');
  };

  const handleSwitchAccount = () => {
    console.log('Switch account clicked');
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
  };

  const handleResetDescription = () => {
    console.log('Reset description clicked');
  };

  return (
    <main className={['min-h-[60vh] w-full', 'px-4 py-6 sm:px-6 lg:px-8'].join(' ')}>
      <div className={['mx-auto w-full max-w-xl', 'space-y-5'].join(' ')}>
        <PageHeader
          title="Dine detaljer"
          subtitle="Bookingprofil"
          description="Dette vil vi bruke til bekreftelser og kvitteringer."
          userInitials={user ? initials : undefined}
          userId={user?.id}
        />

        {error && <ErrorMessage message="Vi kunne ikke laste profilen din akkurat nå." details={error} />}

        {user && (
          <UserProfileCard
            givenName={user.givenName}
            familyName={user.familyName}
            email={user.email}
            userId={user.id}
            onEditDetails={handleEditDetails}
            onSwitchAccount={handleSwitchAccount}
          />
        )}

        {/* NO BOOKING PROFILE - CREATE NEW */}
        {!bookingProfile && !error && <EmptyBookingProfile onCreateProfile={() => setCreateDialogOpen(true)} />}

        {/* COMPANY BOOKING PROFILE CARD - EXISTS */}
        {bookingProfile && (
          <BookingProfileCard
            description={bookingProfile.description}
            imageId={bookingProfile.imageId}
            onEditProfile={handleEditProfile}
            onResetDescription={handleResetDescription}
          />
        )}
      </div>

      {/* CREATE BOOKING PROFILE DIALOG */}
      <FormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Lag bookingprofil"
        fields={[]}
        formData={formData}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        actions={[
          {
            label: 'Avbryt',
            variant: 'outline',
            onClick: () => setCreateDialogOpen(false),
          },
          {
            label: 'Opprett',
            variant: 'default',
            type: 'submit',
          },
        ]}
      />
    </main>
  );
}

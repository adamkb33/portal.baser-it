import { useFetcher, useLoaderData } from 'react-router';
import { useState, useEffect } from 'react';
import { FormDialog } from '~/components/dialog/form-dialog';
import { ErrorMessage } from '~/components/errors/error-messages';
import { UserProfileCard } from '~/components/cards/user-card';
import { fileToBase64 } from '~/lib/file.utils';
import { createImageUploadRenderer } from '~/components/dialog/create-image-upload-renderer';
import { createServicesSelectionRenderer } from '~/components/dialog/create-services-rendrer';

import { profileLoader, profileAction, actions, type BookingProfileLoaderData } from './_features/profile.feature';
import { EmptyBookingProfile } from './_components/booking-profile-placeholder';
import { BookingProfileCard } from './_components/booking-profile-card';
import { PageHeader } from './_components/page-header';

export const loader = profileLoader;
export const action = profileAction;

export default function BookingCompanyUserProfile() {
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();

  const { user, bookingProfile, services = [], error } = useLoaderData() as BookingProfileLoaderData;
  const [createOrUpdateDialogOpen, setCreateOrUpdateBookingProfileDialogOpen] = useState(false);
  const [createOrUpdateDialogForm, setCreateOrUpdateDialogForm] = useState({
    description: '',
    services: [] as number[],
    image: null as { file: File; previewUrl: string } | null,
  });

  const initials = (user?.givenName?.[0] ?? '').toUpperCase() + (user?.familyName?.[0] ?? '').toUpperCase();

  useEffect(() => {
    if (createOrUpdateDialogOpen && bookingProfile) {
      setCreateOrUpdateDialogForm({
        description: bookingProfile.description || '',
        services: bookingProfile.services?.map((s: any) => s.id) || [],
        image: null,
      });
    } else if (createOrUpdateDialogOpen && !bookingProfile) {
      setCreateOrUpdateDialogForm({
        description: '',
        services: [],
        image: null,
      });
    }
  }, [createOrUpdateDialogOpen, bookingProfile]);

  const handleFieldChange = (name: keyof typeof createOrUpdateDialogForm, value: any) => {
    setCreateOrUpdateDialogForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetOrCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('actionType', actions.GET_OR_CREATE_BOOKING_PROFILE);
      formData.append('description', createOrUpdateDialogForm.description);

      for (const serviceId of createOrUpdateDialogForm.services) {
        formData.append('services[]', String(serviceId));
      }

      if (createOrUpdateDialogForm.image?.file) {
        const base64Data = await fileToBase64(createOrUpdateDialogForm.image.file);
        formData.append('image[fileName]', createOrUpdateDialogForm.image.file.name);
        formData.append('image[contentType]', createOrUpdateDialogForm.image.file.type || 'application/octet-stream');
        formData.append('image[data]', base64Data);
      }

      fetcher.submit(formData, {
        method: 'post',
      });
      setCreateOrUpdateBookingProfileDialogOpen(false);
    } catch (error) {
      console.error('Failed to submit booking profile:', error);
    }
  };

  const handleEditUserDetails = () => {};
  const handleSwitchAccount = () => {};

  const handleEditBookingProfile = () => {
    setCreateOrUpdateBookingProfileDialogOpen(true);
  };

  const renderImageUpload = createImageUploadRenderer();
  const renderServicesSelection = createServicesSelectionRenderer({ services });

  const dialogTitle = bookingProfile ? 'Rediger bookingprofil' : 'Lag bookingprofil';
  const dialogSubmitLabel = bookingProfile ? 'Lagre endringer' : 'Opprett';

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
            onEditDetails={handleEditUserDetails}
            onSwitchAccount={handleSwitchAccount}
          />
        )}

        {!bookingProfile && !error && (
          <EmptyBookingProfile onCreateProfile={() => setCreateOrUpdateBookingProfileDialogOpen(true)} />
        )}

        {bookingProfile && (
          <BookingProfileCard
            description={bookingProfile.description}
            image={bookingProfile.image}
            onEditProfile={handleEditBookingProfile}
          />
        )}
      </div>

      <FormDialog
        open={createOrUpdateDialogOpen}
        onOpenChange={setCreateOrUpdateBookingProfileDialogOpen}
        title={dialogTitle}
        fields={[
          {
            name: 'image',
            label: 'Profilbilde',
            render: renderImageUpload,
            description: bookingProfile?.image?.url
              ? 'Last opp et nytt bilde for å erstatte det eksisterende.'
              : undefined,
          },
          {
            name: 'description',
            label: 'Beskrivelse',
            type: 'textarea',
            placeholder: 'Fortell bedriften om dine preferanser, tilgangsbehov eller andre relevante detaljer...',
            description: 'Denne beskrivelsen vil være synlig for bedriftens ansatte.',
            className: 'min-h-[120px]',
          },
          {
            name: 'services',
            label: 'Foretrukne tjenester',
            render: renderServicesSelection,
          },
        ]}
        formData={createOrUpdateDialogForm}
        onFieldChange={handleFieldChange}
        onSubmit={handleGetOrCreateProfileSubmit}
        actions={[
          {
            label: 'Avbryt',
            variant: 'outline',
            onClick: () => setCreateOrUpdateBookingProfileDialogOpen(false),
          },
          {
            label: dialogSubmitLabel,
            variant: 'default',
            type: 'submit',
          },
        ]}
      />
    </main>
  );
}

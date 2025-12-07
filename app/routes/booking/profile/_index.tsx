import { data, redirect, useFetcher, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { useState, useEffect } from 'react';
import type { ApiClientError } from '~/api/clients/http';
import { getAccessToken } from '~/lib/auth.utils';
import { baseApi, bookingApi } from '~/lib/utils';
import { FormDialog, type FormFieldRenderProps } from '~/components/dialog/form-dialog';
import { EmptyBookingProfile } from '~/routes/booking/profile/components/booking-profile-placeholder';
import { BookingProfileCard } from '~/routes/booking/profile/components/booking-profile-card';
import { PageHeader } from './components/page-header';
import { ErrorMessage } from '~/components/errors/error-messages';
import { UserProfileCard } from '~/components/cards/user-card';
import { type ActionFunctionArgs } from 'react-router';
import { fileToBase64 } from '~/lib/file.utils';
import { createImageUploadRenderer } from '~/components/dialog/create-image-upload-renderer';
import { createServicesSelectionRenderer } from '~/components/dialog/create-services-rendrer';
import type { BookingProfileDto } from 'tmp/openapi/gen/booking';
import type { UserDto } from '~/api/clients/types';

export type BookingProfileLoaderData = {
  user?: UserDto;
  bookingProfile?: BookingProfileDto;
  services?: Array<{ id: number; name: string }>;
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

    const servicesResponse = await bookingApi(accesToken).ServiceControllerService.ServiceControllerService.getServices(
      {},
    );

    return data<BookingProfileLoaderData>({
      user: userResponse.data as UserDto,
      bookingProfile: bookingProfileResponse,
      services: servicesResponse.data?.content.map((s: any) => ({ id: s.id, name: s.name })) ?? [],
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

const actions = {
  GET_OR_CREATE_BOOKING_PROFILE: 'GET_OR_CREATE_BOOKING_PROFILE',
};

export async function action({ request }: ActionFunctionArgs) {
  try {
    const accesToken = await getAccessToken(request);
    if (!accesToken) {
      return redirect('/');
    }

    const formData = await request.formData();
    const actionType = formData.get('actionType');
    console.log(actionType);

    if (actionType === actions.GET_OR_CREATE_BOOKING_PROFILE) {
      const description = formData.get('description') as string;
      const services = formData.getAll('services[]').map(Number);

      const imageFileName = formData.get('image[fileName]') as string | null;
      const imageContentType = formData.get('image[contentType]') as string | null;
      const imageData = formData.get('image[data]') as string | null;

      const payload: any = {
        description: description || undefined,
        services,
      };

      if (imageFileName && imageContentType && imageData) {
        payload.image = {
          fileName: imageFileName,
          label: imageFileName,
          contentType: imageContentType,
          data: imageData,
        };
      }

      await bookingApi(
        accesToken,
      ).BookingProfileControllerService.BookingProfileControllerService.createOrUpdateProfile({
        requestBody: payload,
      });

      return data({ success: true, message: 'Bookingprofil lagret' });
    }
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));
    if (error as ApiClientError) {
      return { error: error.body.message };
    }

    throw error;
  }
}

export default function BookingProfilePage() {
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();

  const { user, bookingProfile, services = [], error } = useLoaderData() as BookingProfileLoaderData;
  const [createOrUpdateDialogOpen, setCreateOrUpdateBookingProfileDialogOpen] = useState(false);
  const [createOrUpdateDialogForm, setCreateOrUpdateDialogForm] = useState({
    description: '',
    services: [] as number[],
    image: null as { file: File; previewUrl: string } | null,
  });

  const initials = (user?.givenName?.[0] ?? '').toUpperCase() + (user?.familyName?.[0] ?? '').toUpperCase();

  // ✅ Populate form with existing profile data when dialog opens
  useEffect(() => {
    if (createOrUpdateDialogOpen && bookingProfile) {
      setCreateOrUpdateDialogForm({
        description: bookingProfile.description || '',
        services: bookingProfile.services?.map((s: any) => s.id) || [],
        image: null, // Existing image is already saved, user can upload new one to replace
      });
    } else if (createOrUpdateDialogOpen && !bookingProfile) {
      // Reset form for new profile
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

      console.log('Submitting form data:', Object.fromEntries(formData));
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

  const handleResetDescription = () => {};

  const renderImageUpload = createImageUploadRenderer();

  const renderServicesSelection = createServicesSelectionRenderer({ services });

  // ✅ Dynamic dialog title based on whether profile exists
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

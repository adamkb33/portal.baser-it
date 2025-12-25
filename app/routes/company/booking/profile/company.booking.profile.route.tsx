// routes/company/booking/profile/route.tsx
import { useFetcher, useLoaderData } from 'react-router';
import { useState, useEffect } from 'react';
import { FormDialog } from '~/components/dialog/form-dialog';
import { ErrorMessage } from '~/components/errors/error-messages';
import { UserProfileCard } from '~/components/cards/user-card';
import { fileToBase64 } from '~/lib/file.utils';
import { createImageUploadRenderer } from '~/components/dialog/create-image-upload-renderer';
import { createServicesSelectionRenderer } from '~/components/dialog/create-services-rendrer';

import {
  profileLoader,
  profileAction,
  actions,
  type BookingProfileLoaderData,
} from '../../../company/booking/profile/_features/profile.feature';
import { EmptyBookingProfile } from '../../../company/booking/profile/_components/booking-profile-placeholder';
import { BookingProfileCard } from '../../../company/booking/profile/_components/booking-profile-card';
import { PageHeader } from '../../../company/booking/profile/_components/page-header';

export const loader = profileLoader;
export const action = profileAction;

export default function BookingCompanyUserProfile() {
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();

  const { bookingProfile, services = [], error } = useLoaderData() as BookingProfileLoaderData;
  const [createOrUpdateDialogOpen, setCreateOrUpdateBookingProfileDialogOpen] = useState(false);
  const [createOrUpdateDialogForm, setCreateOrUpdateDialogForm] = useState({
    description: '',
    services: [] as number[],
    image: null as { file: File; previewUrl: string } | null,
  });

  useEffect(() => {
    if (createOrUpdateDialogOpen && bookingProfile) {
      setCreateOrUpdateDialogForm({
        description: bookingProfile.description || '',
        services: bookingProfile.services?.map((s: any) => s.id) || [],
        image: null, // New upload starts as null
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

      // Only append image if user uploaded a new one
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

  const handleEditBookingProfile = () => {
    setCreateOrUpdateBookingProfileDialogOpen(true);
  };

  // Pass existing image URL to the renderer
  const renderImageUpload = createImageUploadRenderer({
    existingImageUrl: bookingProfile?.image?.url || null,
    helperText: bookingProfile?.image?.url
      ? 'Last opp et nytt bilde for å erstatte det eksisterende.'
      : 'Last opp et profilbilde som vises til kunder.',
  });

  const renderServicesSelection = createServicesSelectionRenderer({ services });

  const dialogTitle = bookingProfile ? 'Rediger bookingprofil' : 'Lag bookingprofil';
  const dialogSubmitLabel = bookingProfile ? 'Lagre endringer' : 'Opprett';

  return (
    <>
      <PageHeader
        title="Dine detaljer"
        subtitle="Bookingprofil"
        description="Hvordan du fremstår for kunder når de booker time med deg."
      />

      {bookingProfile ? (
        <BookingProfileCard bookingProfile={bookingProfile} onEditProfile={handleEditBookingProfile} />
      ) : (
        <EmptyBookingProfile onCreateProfile={() => setCreateOrUpdateBookingProfileDialogOpen(true)} />
      )}

      <FormDialog
        open={createOrUpdateDialogOpen}
        onOpenChange={setCreateOrUpdateBookingProfileDialogOpen}
        title={dialogTitle}
        fields={[
          {
            name: 'image',
            label: 'Profilbilde',
            render: renderImageUpload,
          },
          {
            name: 'description',
            label: 'Beskrivelse',
            type: 'textarea',
            placeholder: 'Fortell kunder om dine spesialiteter, arbeidsområder eller andre relevante detaljer...',
            description: 'Denne beskrivelsen vil være synlig for kunder.',
            className: 'min-h-[120px]',
          },
          {
            name: 'services',
            label: 'Tjenester',
            render: renderServicesSelection,
            description: 'Velg hvilke tjenester du tilbyr.',
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
    </>
  );
}

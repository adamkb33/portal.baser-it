// routes/company/booking/profile/route.tsx
import { useFetcher } from 'react-router';
import { useState, useEffect } from 'react';
import { FormDialog } from '~/components/dialog/form-dialog';
import { fileToBase64 } from '~/lib/file.utils';
import { createImageUploadRenderer } from '~/components/dialog/create-image-upload-renderer';
import { createServicesSelectionRenderer } from '~/components/dialog/create-services-rendrer';
import type { DailyScheduleDto } from '~/api/generated/booking';

import { BookingProfileCard } from '../../../company/booking/profile/_components/booking-profile-card';
import type { Route } from './+types/company.booking.profile.route';
import { CompanyUserBookingProfileController, CompanyUserServiceGroupController } from '~/api/generated/booking';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { withAuth } from '~/api/utils/with-auth';
import { createDailyScheduleRenderer } from '~/components/dialog/create-daily-schedule-renderer';
import { resolveErrorPayload } from '~/lib/api-error';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const [bookingProfileResponse, groupedServiceGroupsResponse] = await withAuth(request, async () => {
      return Promise.all([
        CompanyUserBookingProfileController.getBookingProfile(),
        CompanyUserServiceGroupController.getGroupedServiceGroups(),
      ]);
    });

    return {
      bookingProfile: bookingProfileResponse.data,
      groupedServiceGroups: groupedServiceGroupsResponse.data?.data ?? [],
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente bookingprofil');
    return {
      bookingProfile: undefined,
      groupedServiceGroups: [],
      error: message,
    };
  }
}

export default function BookingCompanyUserProfile({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<{ success?: boolean; message?: string }>();

  const { bookingProfile, groupedServiceGroups = [] } = loaderData;

  const [createOrUpdateDialogOpen, setCreateOrUpdateBookingProfileDialogOpen] = useState(false);
  const [createOrUpdateDialogForm, setCreateOrUpdateDialogForm] = useState({
    description: '',
    services: [] as number[],
    dailySchedules: [] as DailyScheduleDto[],
    image: null as { file: File; previewUrl: string } | null,
  });

  useEffect(() => {
    if (createOrUpdateDialogOpen && bookingProfile) {
      // Extract individual service IDs from all service groups
      const serviceIds =
        bookingProfile.services?.flatMap((group: any) => group.services.map((service: any) => service.id)) || [];

      setCreateOrUpdateDialogForm({
        description: bookingProfile.description || '',
        services: serviceIds,
        dailySchedules: bookingProfile.dailySchedule || [],
        image: null,
      });
    } else if (createOrUpdateDialogOpen && !bookingProfile) {
      setCreateOrUpdateDialogForm({
        description: '',
        services: [],
        dailySchedules: [],
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
      formData.append('description', createOrUpdateDialogForm.description);

      // Services
      for (const serviceId of createOrUpdateDialogForm.services) {
        formData.append('services[]', String(serviceId));
      }

      // Daily schedules
      if (createOrUpdateDialogForm.dailySchedules.length > 0) {
        formData.append('dailySchedules', JSON.stringify(createOrUpdateDialogForm.dailySchedules));
      }

      // Handle image action
      if (createOrUpdateDialogForm.image?.file) {
        formData.append('imageAction', 'UPLOAD');
        const base64Data = await fileToBase64(createOrUpdateDialogForm.image.file);
        formData.append('imageData[fileName]', createOrUpdateDialogForm.image.file.name);
        formData.append(
          'imageData[contentType]',
          createOrUpdateDialogForm.image.file.type || 'application/octet-stream',
        );
        formData.append('imageData[data]', base64Data);
        formData.append('imageData[label]', createOrUpdateDialogForm.image.file.name);
      }

      fetcher.submit(formData, {
        method: 'post',
        action: API_ROUTES_MAP['company.booking.profile.create-or-update'].url,
      });
      setCreateOrUpdateBookingProfileDialogOpen(false);
    } catch (error) {
      console.error('Failed to submit booking profile:', error);
    }
  };

  const handleEditBookingProfile = () => {
    setCreateOrUpdateBookingProfileDialogOpen(true);
  };

  const renderImageUpload = createImageUploadRenderer({
    existingImageUrl: bookingProfile?.image?.url || null,
    helperText: bookingProfile?.image?.url
      ? 'Last opp et nytt bilde for å erstatte det eksisterende.'
      : 'Last opp et profilbilde som vises til kunder.',
  });

  const renderServicesSelection = createServicesSelectionRenderer({ services: groupedServiceGroups });

  const renderDailySchedule = createDailyScheduleRenderer({
    helperText: 'Velg hvilke dager og klokkeslett du er tilgjengelig for bookinger.',
  });

  const dialogTitle = bookingProfile ? 'Rediger bookingprofil' : 'Lag bookingprofil';
  const dialogSubmitLabel = bookingProfile ? 'Lagre endringer' : 'Opprett';

  return (
    <>
      <BookingProfileCard bookingProfile={bookingProfile} onEditProfile={handleEditBookingProfile} />

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
          {
            name: 'dailySchedules',
            label: 'Arbeidstider',
            render: renderDailySchedule,
            description: 'Sett dine tilgjengelige dager og klokkeslett.',
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

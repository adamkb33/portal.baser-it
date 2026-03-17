import { data } from 'react-router';
import type { BookingProfileDto, DailyScheduleDto, GroupedServiceGroupDto } from '~/api/generated/booking';
import { CompanyUserBookingProfileController, CompanyUserServiceGroupController } from '~/api/generated/booking';
import { withAuth } from '~/api/utils/with-auth';
import { resolveErrorPayload } from '~/lib/api-error';
import { ROUTES_MAP } from '~/lib/route-tree';
import { redirectWithSuccess } from '~/routes/company/_lib/flash-message.server';

export type BookingProfileFormLoaderData = {
  bookingProfile: BookingProfileDto | null;
  groupedServiceGroups: GroupedServiceGroupDto[];
  error: string | null;
};

export async function loadBookingProfileFormData(request: Request): Promise<BookingProfileFormLoaderData> {
  try {
    const [bookingProfileResponse, groupedServiceGroupsResponse] = await withAuth(request, async () => {
      return Promise.all([
        CompanyUserBookingProfileController.getBookingProfile(),
        CompanyUserServiceGroupController.getGroupedServiceGroups(),
      ]);
    });

    return {
      bookingProfile: bookingProfileResponse.data ?? null,
      groupedServiceGroups: groupedServiceGroupsResponse.data?.data ?? [],
      error: null,
    };
  } catch (error) {
    const { message } = resolveErrorPayload(error, 'Kunne ikke hente bookingprofil');
    return {
      bookingProfile: null,
      groupedServiceGroups: [],
      error: message,
    };
  }
}

export async function submitBookingProfileForm(request: Request) {
  const formData = await request.formData();

  try {
    const description = String(formData.get('description') ?? '').trim();
    const serviceIds = formData.getAll('services[]').map((value) => Number(value)).filter((value) => Number.isInteger(value));
    const dailySchedulesRaw = String(formData.get('dailySchedules') ?? '[]');
    const removeImage = String(formData.get('removeImage') ?? '') === 'true';
    const existingImageId = Number(formData.get('existingImageId') ?? '');
    const imageFile = formData.get('imageFile');

    const payload: {
      description?: string;
      serviceIds: number[];
      dailySchedules?: DailyScheduleDto[];
      imageAction?: {
        type: 'Upload';
        data: {
          fileName: string;
          label: string;
          contentType: string;
          data: string;
        };
      } | {
        type: 'Delete';
        imageId: number;
      };
    } = {
      description: description || undefined,
      serviceIds,
    };

    const parsedSchedules = JSON.parse(dailySchedulesRaw);
    if (Array.isArray(parsedSchedules) && parsedSchedules.length > 0) {
      payload.dailySchedules = parsedSchedules;
    }

    if (imageFile instanceof File && imageFile.size > 0) {
      const base64Data = Buffer.from(await imageFile.arrayBuffer()).toString('base64');
      payload.imageAction = {
        type: 'Upload',
        data: {
          fileName: imageFile.name,
          contentType: imageFile.type || 'application/octet-stream',
          data: base64Data,
          label: imageFile.name,
        },
      };
    } else if (removeImage && Number.isInteger(existingImageId) && existingImageId > 0) {
      payload.imageAction = {
        type: 'Delete',
        imageId: existingImageId,
      };
    }

    await withAuth(request, async () => {
      await CompanyUserBookingProfileController.createOrUpdateProfile({
        body: payload,
      });
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.booking.profile'].href, 'Bookingprofil lagret');
  } catch (error) {
    const { message, status } = resolveErrorPayload(error, 'Kunne ikke lagre bookingprofil');
    return data({ error: message }, { status: status ?? 400 });
  }
}

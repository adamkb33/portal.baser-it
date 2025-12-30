// app/routes/api/company/booking/profile/update.api-route.ts
import { type ActionFunctionArgs } from 'react-router';
import { BookingProfileController } from '~/api/generated/booking';
import { redirectWithSuccess, redirectWithError } from '~/routes/company/_lib/flash-message.server';
import { ROUTES_MAP } from '~/lib/route-tree';
import { withAuth } from '~/api/utils/with-auth';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
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

    await withAuth(request, async () => {
      await BookingProfileController.createOrUpdateProfile({
        body: payload,
      });
    });

    return redirectWithSuccess(request, ROUTES_MAP['company.booking.profile'].href, 'Bookingprofil lagret');
  } catch (error: any) {
    console.error(JSON.stringify(error, null, 2));

    return redirectWithError(
      request,
      ROUTES_MAP['company.booking.profile'].href,
      error?.message || 'Kunne ikke lagre bookingprofil',
    );
  }
}

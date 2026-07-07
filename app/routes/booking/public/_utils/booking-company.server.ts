import { PublicCompanyController, type CompanySummaryDto } from '~/api/generated/base';

export async function getBookingCompanySummary(companyId: number): Promise<CompanySummaryDto | null> {
  try {
    const response = await PublicCompanyController.publicGetCompanyById({
      path: {
        companyId,
      },
    });

    return response.data?.data ?? null;
  } catch {
    return null;
  }
}

import { Base, type PaginatedResponseSystemAdminCompanyDto, type SystemAdminCompanyDto } from '~/api/generated/base';
import { withAuth } from '~/api/utils/with-auth';

export const DEFAULT_COMPANY_PAGE_SIZE = 10;
export const DEFAULT_COMPANY_OPTION_SIZE = 100;
export const DEFAULT_COMPANY_SORT = 'name,asc';

export function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseNonNegativeInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function getCompanyDisplayName(company: SystemAdminCompanyDto): string {
  return company.name?.trim() || `Org.nr ${company.orgNum}`;
}

export function formatCompanyOptionLabel(company: SystemAdminCompanyDto): string {
  return `${getCompanyDisplayName(company)} (${company.orgNum})`;
}

export async function loadSystemAdminCompanies(
  request: Request,
  query: { page?: number; size?: number; sort?: string } = {},
): Promise<PaginatedResponseSystemAdminCompanyDto> {
  const response = await withAuth(request, () =>
    Base.listCompanies({
      query: {
        page: query.page ?? 0,
        size: query.size ?? DEFAULT_COMPANY_PAGE_SIZE,
        sort: query.sort ?? DEFAULT_COMPANY_SORT,
      },
    }),
  );

  return (
    response.data?.data ?? {
      content: [],
      page: query.page ?? 0,
      size: query.size ?? DEFAULT_COMPANY_PAGE_SIZE,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    }
  );
}

export async function loadSystemAdminCompanyOptions(request: Request): Promise<SystemAdminCompanyDto[]> {
  const companies = await loadSystemAdminCompanies(request, {
    page: 0,
    size: DEFAULT_COMPANY_OPTION_SIZE,
    sort: DEFAULT_COMPANY_SORT,
  });

  return companies.content;
}

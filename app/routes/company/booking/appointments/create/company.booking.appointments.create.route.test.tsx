import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTES_MAP, ROUTE_TREE } from '~/lib/route-tree';
import { action, loader } from './company.booking.appointments.create.route';
import { parseCreateFlowQueryState, withCreateFlowQueryState } from './_utils/create-flow-query-params';

const mocks = vi.hoisted(() => {
  return {
    resolveOrCreateAppointmentCustomer: vi.fn(),
    companyUserCreateAppointment: vi.fn(),
    getAppointmentCustomers: vi.fn(),
    getBookingProfile: vi.fn(),
    getSchedule: vi.fn(),
    redirectWithSuccess: vi.fn(),
  };
});

vi.mock('~/api/utils/with-auth', () => ({
  withAuth: vi.fn(async (_request: Request, callback: () => Promise<unknown>) => callback()),
}));

vi.mock('~/api/generated/base', () => ({
  CompanyUserController: {
    resolveOrCreateAppointmentCustomer: mocks.resolveOrCreateAppointmentCustomer,
  },
}));

vi.mock('~/api/generated/booking', () => ({
  CompanyUserAppointmentController: {
    companyUserCreateAppointment: mocks.companyUserCreateAppointment,
    getAppointmentCustomers: mocks.getAppointmentCustomers,
  },
  CompanyUserBookingProfileController: {
    getBookingProfile: mocks.getBookingProfile,
  },
  CompanyUserScheduleController: {
    getSchedule: mocks.getSchedule,
  },
}));

vi.mock('~/routes/company/booking/_components/customer-selector', () => ({
  CustomerSelector: () => null,
}));

vi.mock('~/routes/company/booking/_components/services-selector', () => ({
  ServicesSelector: () => null,
}));

vi.mock('~/routes/company/booking/_components/date-time-selector', () => ({
  DateTimeSelector: () => null,
}));

vi.mock('~/routes/company/_lib/flash-message.server', () => ({
  redirectWithSuccess: mocks.redirectWithSuccess,
}));

describe('company.booking.appointments.create.route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirectWithSuccess.mockReturnValue({ ok: true });
    mocks.getAppointmentCustomers.mockResolvedValue({
      data: {
        data: {
          content: [
            {
              id: 9,
              givenName: 'Ada',
              familyName: 'Lovelace',
              email: 'ada@example.com',
              emailVerified: true,
              mobileNumber: '+4712345678',
              mobileVerified: true,
            },
          ],
          page: 0,
          size: 5,
          totalElements: 1,
          totalPages: 1,
        },
      },
    });
    mocks.getBookingProfile.mockResolvedValue({ data: { services: [] } });
    mocks.getSchedule.mockResolvedValue({ data: { data: [] } });
  });

  it('registers create route without nested flow routes in route tree', () => {
    expect(ROUTES_MAP['company.booking.appointments.create']?.href).toBe('/company/booking/appointments/create');
    expect(ROUTES_MAP['company.booking.appointments.create.existing-user']).toBeUndefined();
    expect(ROUTES_MAP['company.booking.appointments.create.new-user']).toBeUndefined();

    const companyBranch = ROUTE_TREE.find((branch) => branch.id === 'company');
    const bookingBranch = companyBranch?.children?.find((branch) => branch.id === 'company.booking');
    const appointmentsBranch = bookingBranch?.children?.find((branch) => branch.id === 'company.booking.appointments');
    const createBranch = appointmentsBranch?.children?.find((branch) => branch.id === 'company.booking.appointments.create');

    expect(createBranch).toBeTruthy();
    expect(createBranch?.children).toBeUndefined();
  });

  it('loads customers with pagination/search from appointment customers endpoint', async () => {
    const request = new Request(
      'http://localhost/company/booking/appointments/create?contact-page=2&contact-size=10&customer-search=ada',
    );

    await loader({ request } as never);

    expect(mocks.getAppointmentCustomers).toHaveBeenCalledWith({
      query: {
        page: 2,
        size: 10,
        sort: 'familyName',
        direction: 'ASC',
        search: 'ada',
      },
    });
  });

  it('resolves customer then creates appointment successfully', async () => {
    mocks.resolveOrCreateAppointmentCustomer.mockResolvedValueOnce({
      data: { data: { userId: 44, status: 'RESOLVED_EXISTING' } },
    });
    mocks.companyUserCreateAppointment.mockResolvedValueOnce({
      data: { message: { value: 'Avtalen er opprettet.' } },
    });

    const formData = new FormData();
    formData.append('email', 'ada@example.com');
    formData.append('serviceIds', '1,2');
    formData.append('startTime', '2026-03-01T08:00:00.000Z');

    const request = new Request('http://localhost/company/booking/appointments/create', {
      method: 'POST',
      body: formData,
    });

    await action({ request } as never);

    expect(mocks.resolveOrCreateAppointmentCustomer).toHaveBeenCalledWith({
      body: {
        email: 'ada@example.com',
        mobileNumber: undefined,
        givenName: undefined,
        familyName: undefined,
      },
    });
    expect(mocks.companyUserCreateAppointment).toHaveBeenCalledWith({
      body: {
        userId: 44,
        serviceIds: [1, 2],
        startTime: '2026-03-01T08:00:00.000Z',
      },
    });
    expect(mocks.redirectWithSuccess).toHaveBeenCalledOnce();
  });

  it('skips resolver and creates appointment directly when userId is provided', async () => {
    mocks.companyUserCreateAppointment.mockResolvedValueOnce({
      data: { message: { value: 'Avtalen er opprettet.' } },
    });

    const formData = new FormData();
    formData.append('userId', '55');
    formData.append('serviceIds', '1,2');
    formData.append('startTime', '2026-03-01T08:00:00.000Z');

    const request = new Request('http://localhost/company/booking/appointments/create', {
      method: 'POST',
      body: formData,
    });

    await action({ request } as never);

    expect(mocks.resolveOrCreateAppointmentCustomer).not.toHaveBeenCalled();
    expect(mocks.companyUserCreateAppointment).toHaveBeenCalledWith({
      body: {
        userId: 55,
        serviceIds: [1, 2],
        startTime: '2026-03-01T08:00:00.000Z',
      },
    });
  });

  it('returns resolver conflict message on 409', async () => {
    mocks.resolveOrCreateAppointmentCustomer.mockRejectedValueOnce({
      response: { status: 409 },
    });

    const formData = new FormData();
    formData.append('email', 'ada@example.com');
    formData.append('mobileNumber', '+4799999999');
    formData.append('serviceIds', '1,2');
    formData.append('startTime', '2026-03-01T08:00:00.000Z');

    const request = new Request('http://localhost/company/booking/appointments/create', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);

    expect(result).toEqual({
      error: 'Email and mobile belong to different customers. Please use only one or correct contact info.',
    });
  });

  it('returns appointment conflict message on 409 after successful resolve', async () => {
    mocks.resolveOrCreateAppointmentCustomer.mockResolvedValueOnce({
      data: { data: { userId: 44, status: 'RESOLVED_EXISTING' } },
    });
    mocks.companyUserCreateAppointment.mockRejectedValueOnce({
      response: { status: 409 },
    });

    const formData = new FormData();
    formData.append('email', 'ada@example.com');
    formData.append('serviceIds', '1,2');
    formData.append('startTime', '2026-03-01T08:00:00.000Z');

    const request = new Request('http://localhost/company/booking/appointments/create', {
      method: 'POST',
      body: formData,
    });

    const result = await action({ request } as never);

    expect(result).toEqual({
      error: 'Valgt tidspunkt ble nettopp opptatt. Velg et annet tidspunkt.',
    });
  });

  it('loads query state, updates it, and restores it from url params', () => {
    const initial = new URLSearchParams('userId=7&serviceIds=11,13&startTime=2026-03-01T08:00:00.000Z&givenName=Ada');
    const parsedInitial = parseCreateFlowQueryState(initial);
    expect(parsedInitial.userId).toBe(7);
    expect(parsedInitial.givenName).toBe('Ada');
    expect(parsedInitial.serviceIds).toEqual([11, 13]);

    const updated = withCreateFlowQueryState(initial, {
      familyName: 'Lovelace',
      serviceIds: [11, 13, 17],
      startTime: '2026-03-02T09:30:00.000Z',
    });
    expect(updated.get('serviceIds')).toBe('11,13,17');
    expect(updated.get('familyName')).toBe('Lovelace');

    const restored = parseCreateFlowQueryState(new URLSearchParams(updated.toString()));
    expect(restored.serviceIds).toEqual([11, 13, 17]);
    expect(restored.familyName).toBe('Lovelace');
  });
});

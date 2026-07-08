import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getAppointmentNotificationHref } from './company.notifications.route';

const routeSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'company.notifications.route.tsx'),
  'utf8',
);

describe('company notifications appointment deep links', () => {
  it('builds company appointment deep links for appointment source references', () => {
    expect(
      getAppointmentNotificationHref({
        sourceRefType: 'APPOINTMENT',
        sourceRefId: '123',
      }),
    ).toBe('/company/booking/appointments/123');
  });

  it.each([
    { sourceRefType: 'OFFER', sourceRefId: '123' },
    { sourceRefType: 'APPOINTMENT', sourceRefId: undefined },
    { sourceRefType: 'APPOINTMENT', sourceRefId: '' },
    { sourceRefType: 'APPOINTMENT', sourceRefId: 'abc' },
    { sourceRefType: 'APPOINTMENT', sourceRefId: '12abc' },
  ])('falls back to normal notification behavior for %#', (notification) => {
    expect(getAppointmentNotificationHref(notification)).toBeNull();
  });

  it('uses appointment deep links before falling back to the notification detail route', () => {
    expect(routeSource).toContain('const appointmentHref = getAppointmentNotificationHref(notification)');
    expect(routeSource).toContain('navigate(appointmentHref)');
    expect(routeSource).toContain("ROUTES_MAP['company.notifications.view']");
  });
});

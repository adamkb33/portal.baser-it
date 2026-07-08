import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'booking.public.appointment.session.contact.verify-mobile.route.tsx'),
  'utf8',
);

describe('booking contact verify-mobile route', () => {
  it('does not automatically resend SMS when the page renders', () => {
    expect(routeSource).not.toContain('resendFetcher.submit');
    expect(routeSource).not.toContain('sessionStorage');
    expect(routeSource).not.toContain('AUTO_RESEND');
  });

  it('keeps SMS resend as an explicit user action', () => {
    expect(routeSource).toContain('<resendFetcher.Form');
    expect(routeSource).toContain("action={API_ROUTES_MAP['auth.resend-verification.mobile'].url}");
    expect(routeSource).toContain('Send SMS på nytt');
  });
});

import { describe, expect, it } from 'vitest';
import {
  action as collectEmailAction,
  loader as collectEmailLoader,
} from './collect-email/booking.public.appointment.session.contact.collect-email.route';
import {
  action as collectMobileAction,
  loader as collectMobileLoader,
} from './collect-mobile/booking.public.appointment.session.contact.collect-mobile.route';
import {
  action as signInAction,
  loader as signInLoader,
} from './sign-in/booking.public.appointment.session.contact.sign-in.route';
import {
  action as signUpAction,
  loader as signUpLoader,
} from './sign-up/booking.public.appointment.session.contact.sign-up.route';
import {
  action as verifyEmailAction,
  loader as verifyEmailLoader,
} from './verify-email/booking.public.appointment.session.contact.verify-email.route';

function getLocation(result: unknown): string | null {
  return result instanceof Response ? result.headers.get('Location') : null;
}

describe('obsolete booking contact auth routes', () => {
  it.each([
    ['sign-in loader', signInLoader],
    ['sign-in action', signInAction],
    ['sign-up loader', signUpLoader],
    ['sign-up action', signUpAction],
    ['verify-email loader', verifyEmailLoader],
    ['verify-email action', verifyEmailAction],
    ['collect-email loader', collectEmailLoader],
    ['collect-email action', collectEmailAction],
    ['collect-mobile loader', collectMobileLoader],
    ['collect-mobile action', collectMobileAction],
  ])('%s redirects to the booking contact resolver', async (_name, handler) => {
    const result = await handler({
      request: new Request('https://portal.pitell.no/booking/public/appointment/session/contact/old', {
        method: 'POST',
      }),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session/contact');
  });
});

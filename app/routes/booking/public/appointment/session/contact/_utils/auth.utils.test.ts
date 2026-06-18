import { describe, expect, it } from 'vitest';
import { ROUTES_MAP } from '~/lib/routing/route-tree';
import {
  redirectAuthStatusNextStepHref,
  resolveAuthNextStepHref,
  resolveAuthStatusNextStepHref,
  shouldStoreVerificationToken,
} from './auth.utils';

describe('booking contact auth step matrix', () => {
  it.each([
    { nextStep: 'COLLECT_EMAIL', expected: ROUTES_MAP['booking.public.appointment.session.employee'].href },
    {
      nextStep: 'COLLECT_MOBILE',
      expected: ROUTES_MAP['booking.public.appointment.session.contact.collect-mobile'].href,
    },
    { nextStep: 'VERIFY_EMAIL', expected: ROUTES_MAP['booking.public.appointment.session.employee'].href },
    {
      nextStep: 'VERIFY_MOBILE',
      expected: ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href,
    },
    { nextStep: 'DONE', expected: ROUTES_MAP['booking.public.appointment.session.employee'].href },
    { nextStep: null, expected: null },
    { nextStep: undefined, expected: null },
  ])('maps $nextStep', ({ nextStep, expected }) => {
    expect(resolveAuthNextStepHref(nextStep as never)).toBe(expected);
  });

  it('maps status helper through auth status shape', () => {
    expect(
      resolveAuthStatusNextStepHref({
        nextStep: 'VERIFY_MOBILE',
        user: {
          id: 1,
          mobileVerified: false,
          emailVerified: false,
          hasPassword: false,
        },
      } as never),
    ).toBe(ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href);
  });

  it.each([
    {
      name: 'missing mobile',
      authStatus: {
        nextStep: 'COLLECT_EMAIL',
        user: { id: 1, emailVerified: false, mobileVerified: false, hasPassword: false },
      },
      expected: ROUTES_MAP['booking.public.appointment.session.contact.collect-mobile'].href,
    },
    {
      name: 'unverified mobile',
      authStatus: {
        nextStep: 'COLLECT_EMAIL',
        user: {
          id: 1,
          mobileNumber: '+4740104131',
          emailVerified: false,
          mobileVerified: false,
          hasPassword: false,
        },
      },
      expected: ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href,
    },
    {
      name: 'verified mobile',
      authStatus: {
        nextStep: 'VERIFY_EMAIL',
        user: {
          id: 1,
          mobileNumber: '+4740104131',
          emailVerified: false,
          mobileVerified: true,
          hasPassword: false,
        },
      },
      expected: ROUTES_MAP['booking.public.appointment.session.employee'].href,
    },
  ])('normalizes legacy email step for $name', ({ authStatus, expected }) => {
    expect(resolveAuthStatusNextStepHref(authStatus as never)).toBe(expected);
  });

  it('redirect helper uses normalized auth status, not raw nextStep', () => {
    const response = redirectAuthStatusNextStepHref({
      nextStep: 'COLLECT_EMAIL',
      user: {
        id: 1,
        mobileNumber: '+4740104131',
        emailVerified: false,
        mobileVerified: false,
        hasPassword: false,
      },
    } as never);

    expect(response.headers.get('Location')).toBe(
      ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href,
    );
  });

  it.each([
    { nextStep: 'VERIFY_EMAIL', expected: false },
    { nextStep: 'VERIFY_MOBILE', expected: true },
    { nextStep: 'COLLECT_EMAIL', expected: false },
    { nextStep: 'COLLECT_MOBILE', expected: false },
    { nextStep: 'DONE', expected: false },
    { nextStep: null, expected: false },
  ])('shouldStoreVerificationToken for $nextStep', ({ nextStep, expected }) => {
    expect(shouldStoreVerificationToken(nextStep as never)).toBe(expected);
  });
});

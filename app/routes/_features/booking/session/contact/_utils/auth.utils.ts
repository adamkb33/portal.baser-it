import { redirect } from 'react-router';
import type { SignInResponseDto, SignUpResponseDto, UserAuthStatusDto } from '~/api/generated/base';
import { getBookingRouteMap } from '../../../_utils/booking.route-map';
import type { BookingSurface } from '../../../_utils/booking.surface';

export function resolveAuthNextStepHref(
  nextStep: SignInResponseDto['nextStep'] | SignUpResponseDto['nextStep'] | null | undefined,
  surface: BookingSurface = 'public',
) {
  const routes = getBookingRouteMap(surface);

  switch (nextStep) {
    case 'COLLECT_EMAIL':
      return routes.contactCollectEmail;
    case 'COLLECT_MOBILE':
      return routes.contactCollectMobile;
    case 'VERIFY_EMAIL':
      return routes.contactVerifyEmail;
    case 'VERIFY_MOBILE':
      return routes.contactVerifyMobile;
    case 'DONE':
      return routes.employee;
    default:
      return null;
  }
}

export function resolveAuthStatusNextStepHref(
  authStatus: UserAuthStatusDto | null | undefined,
  surface: BookingSurface = 'public',
) {
  return resolveAuthNextStepHref(authStatus?.nextStep, surface);
}

export function redirectAuthStatusNextStepHref(authStatus: UserAuthStatusDto, surface: BookingSurface = 'public') {
  const routes = getBookingRouteMap(surface);
  const nextStepHref = resolveAuthNextStepHref(authStatus.nextStep, surface);
  if (nextStepHref) {
    return redirect(nextStepHref);
  }

  return redirect(routes.contact);
}

export function shouldStoreVerificationToken(
  nextStep: SignInResponseDto['nextStep'] | SignUpResponseDto['nextStep'] | null | undefined,
) {
  return nextStep !== 'DONE';
}

export function hasAuthErrors(
  payload:
    | SignInResponseDto
    | SignUpResponseDto
    | { error?: string; errors?: unknown; success?: boolean }
    | null
    | undefined,
) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  return (
    ('error' in payload && typeof payload.error === 'string' && payload.error.length > 0) ||
    ('errors' in payload && Array.isArray(payload.errors) && payload.errors.length > 0) ||
    ('success' in payload && payload.success === false)
  );
}

export function getFetcherError(
  payload: SignInResponseDto | SignUpResponseDto | { error?: string } | null | undefined,
) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }
  return null;
}

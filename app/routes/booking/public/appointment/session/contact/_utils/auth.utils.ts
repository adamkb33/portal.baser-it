import { redirect } from 'react-router';
import type { DeliveryStatusDto, SignInResponseDto, SignUpResponseDto, UserAuthStatusDto } from '~/api/generated/base';
import { getBookingRouteMap } from '../../../../_utils/booking.route-map';

type NextStep = SignInResponseDto['nextStep'] | SignUpResponseDto['nextStep'] | null | undefined;

type ResolveNextStepOptions = {
  emailDelivery?: DeliveryStatusDto | null;
  mobileDelivery?: DeliveryStatusDto | null;
};

function buildHref(href: string, params?: URLSearchParams) {
  const search = params?.toString();
  return search ? `${href}?${search}` : href;
}

export function resolveAuthNextStepHref(
  nextStep: NextStep,
  options: ResolveNextStepOptions = {},
) {
  const routes = getBookingRouteMap();

  switch (nextStep) {
    case 'COLLECT_EMAIL':
      return routes.contactCollectEmail;
    case 'COLLECT_MOBILE':
      return routes.contactCollectMobile;
    case 'VERIFY_EMAIL': {
      const params = new URLSearchParams();
      if (options.emailDelivery?.status) {
        params.set('emailDelivery', options.emailDelivery.status);
      }
      if (options.mobileDelivery?.status) {
        params.set('mobileDelivery', options.mobileDelivery.status);
      }
      return buildHref(routes.contactVerifyEmail, params);
    }
    case 'VERIFY_MOBILE': {
      const params = new URLSearchParams();
      if (options.mobileDelivery?.status) {
        params.set('mobileDelivery', options.mobileDelivery.status);
      }
      return buildHref(routes.contactVerifyMobile, params);
    }
    case 'DONE':
      return routes.employee;
    default:
      return null;
  }
}

export function resolveAuthStatusNextStepHref(authStatus: UserAuthStatusDto | null | undefined) {
  if (!authStatus) {
    return null;
  }

  if (authStatus.nextStep === 'COLLECT_EMAIL' || authStatus.nextStep === 'VERIFY_EMAIL') {
    const routes = getBookingRouteMap();
    if (!authStatus.user.mobileNumber) {
      return routes.contactCollectMobile;
    }
    if (!authStatus.user.mobileVerified) {
      return routes.contactVerifyMobile;
    }
    return routes.employee;
  }

  return resolveAuthNextStepHref(authStatus?.nextStep);
}

export function redirectAuthStatusNextStepHref(authStatus: UserAuthStatusDto) {
  const routes = getBookingRouteMap();
  const nextStepHref = resolveAuthStatusNextStepHref(authStatus);
  if (nextStepHref) {
    return redirect(nextStepHref);
  }

  return redirect(routes.contact);
}

export function shouldStoreVerificationToken(
  nextStep: SignInResponseDto['nextStep'] | SignUpResponseDto['nextStep'] | null | undefined,
) {
  return nextStep === 'VERIFY_MOBILE';
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

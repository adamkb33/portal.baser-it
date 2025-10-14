import { AuthControllerService } from '~/api/clients/identity';
import { OpenAPI } from '~/api/clients/identity/OpenAPI';
import { type AcceptInviteInput } from '../schemas/accept-invite';
import { ENV } from '~/api/config/env';
import { type AuthTokens } from '../token/types';
import { toAuthTokens } from '../token/token-utils';
import { ApiError } from '~/api/clients/http';

export class InvalidInviteTokenError extends Error {
  constructor(message = 'This invite link is invalid or has expired.') {
    super(message);
    this.name = 'InvalidInviteTokenError';
  }
}

export class AcceptInviteRequestError extends Error {
  constructor(message = 'We couldn’t accept your invite.', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AcceptInviteRequestError';
  }
}

export async function acceptInvite(inviteToken: string, payload: AcceptInviteInput): Promise<AuthTokens> {
  OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

  try {
    const response = await AuthControllerService.acceptInvite({
      inviteToken,
      requestBody: {
        givenName: payload.givenName,
        familyName: payload.familyName,
        password: payload.password,
        password2: payload.confirmPassword,
      },
    });

    if (!response.success || !response.data) {
      throw new AcceptInviteRequestError(response.message || 'Unable to accept invite.');
    }

    return toAuthTokens(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400 || error.status === 401) {
        throw new InvalidInviteTokenError();
      }

      throw new AcceptInviteRequestError(error.message, { cause: error });
    }

    throw error;
  }
}

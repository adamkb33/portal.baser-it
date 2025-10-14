import { AuthControllerService } from '~/api/clients/identity';
import { OpenAPI } from '~/api/clients/identity/OpenAPI';
import { ENV } from '~/api/config/env';
import { type SignInInput } from '../schemas/sign-in';
import { type AuthTokens } from '../token/types';
import { toAuthTokens } from '../token/token-utils';
import { ApiClientError } from '~/api/clients/http';

export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class SignInRequestError extends Error {
  constructor(message = 'Unable to sign in', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SignInRequestError';
  }
}

export async function signIn(payload: SignInInput): Promise<AuthTokens> {
  OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

  try {
    const response = await AuthControllerService.signIn({
      requestBody: {
        email: payload.email,
        password: payload.password,
      },
    });

    if (!response.success || !response.data) {
      throw new SignInRequestError(response.message || 'Unable to sign in');
    }

    return toAuthTokens(response.data);
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.status === 400 || error.status === 401) {
        throw new InvalidCredentialsError();
      }

      throw new SignInRequestError(error.message, { cause: error });
    }

    throw error;
  }
}

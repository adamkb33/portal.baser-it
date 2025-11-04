import { AuthControllerService } from '~/api/clients/base';
import { OpenAPI } from '~/api/clients/base/OpenAPI';
import { ENV } from '~/api/config/env';
import { type AuthTokens } from '../token/types';
import { toAuthTokens } from '../token/token-utils';
import { ApiClientError } from '~/api/clients/http';

export class RefreshTokenError extends Error {
  constructor(message = 'Unable to refresh authentication token', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'RefreshTokenError';
  }
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  OpenAPI.BASE = ENV.BASE_SERVICE_BASE_URL;

  try {
    const response = await AuthControllerService.refresh({
      requestBody: {
        refreshToken,
      },
    });

    if (!response.success || !response.data) {
      throw new RefreshTokenError(response.message || 'Unable to refresh token');
    }

    return toAuthTokens(response.data);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new RefreshTokenError(error.message, { cause: error });
    }

    throw error;
  }
}

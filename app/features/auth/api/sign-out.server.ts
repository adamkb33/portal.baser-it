import { AuthControllerService } from '~/api/clients/identity';
import { OpenAPI } from '~/api/clients/identity/OpenAPI';
import { ApiClientError } from '~/api/clients/http';
import { ENV } from '~/api/config/env';

export class SignOutRequestError extends Error {
  constructor(message = 'Unable to sign out', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SignOutRequestError';
  }
}

export async function signOut(userId: number): Promise<void> {
  OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

  try {
    const response = await AuthControllerService.signOut({
      requestBody: { userId },
    });

    if (!response.success) {
      throw new SignOutRequestError(response.message || 'Unable to sign out');
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new SignOutRequestError(error.message, { cause: error });
    }

    throw error;
  }
}

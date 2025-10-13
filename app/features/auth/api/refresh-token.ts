import { AuthControllerService } from "~/api/clients/identity";
import { OpenAPI } from "~/api/clients/identity/OpenAPI";
import { ApiError as HttpClientError } from "~/api/clients/common/core/ApiError";
import { ENV } from "~/api/config/env";
import { type AuthTokens } from "../token/types";
import { toAuthTokens } from "../token/token-utils";

export class RefreshTokenError extends Error {
  constructor(message = "Unable to refresh authentication token", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RefreshTokenError";
  }
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  OpenAPI.BASE = ENV.IDENTITY_BASE_URL;

  try {
    const response = await AuthControllerService.refresh({
      requestBody: {
        refreshToken,
      },
    });

    if (!response.success || !response.data) {
      throw new RefreshTokenError(response.message || "Unable to refresh token");
    }

    return toAuthTokens(response.data);
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new RefreshTokenError(error.message, { cause: error });
    }

    throw error;
  }
}

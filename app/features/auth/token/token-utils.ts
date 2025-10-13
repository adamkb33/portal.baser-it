import { TOKEN_EXPIRY_SKEW_MS } from "./constants";
import { type AuthTokens } from "./types";

export function isAccessTokenExpired(tokens: AuthTokens, skewMs = TOKEN_EXPIRY_SKEW_MS) {
  const now = Date.now();
  return tokens.accessTokenExpiresAt - skewMs <= now;
}

export function isRefreshTokenExpired(tokens: AuthTokens, skewMs = TOKEN_EXPIRY_SKEW_MS) {
  const now = Date.now();
  return tokens.refreshTokenExpiresAt - skewMs <= now;
}

export function toAuthTokens(dto: {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}): AuthTokens {
  return {
    accessToken: dto.accessToken,
    accessTokenExpiresAt: dto.accessTokenExpiresAt,
    refreshToken: dto.refreshToken,
    refreshTokenExpiresAt: dto.refreshTokenExpiresAt,
  };
}

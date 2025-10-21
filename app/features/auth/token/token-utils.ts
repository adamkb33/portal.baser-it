import { type AuthTokens } from './types';

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

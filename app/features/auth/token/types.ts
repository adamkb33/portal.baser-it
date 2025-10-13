export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: number;
}

export interface TokenChangeEvent {
  type: "tokens";
  value: AuthTokens | null;
}

export type TokenListener = (tokens: AuthTokens | null) => void;

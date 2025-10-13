import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import { RefreshTokenError, refreshTokens } from "~/features/auth/api/refresh-token";
import { clearAuthTokens, loadAuthTokens, persistAuthTokens } from "~/features/auth/token/token-storage";
import { isAccessTokenExpired, isRefreshTokenExpired } from "~/features/auth/token/token-utils";
import { type AuthTokens } from "~/features/auth/token/types";
import { ENV } from "~/api/config/env";

let configured = false;
let refreshPromise: Promise<AuthTokens | null> | null = null;

declare module "axios" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function setAuthorizationHeader(config: AxiosRequestConfig, token: string) {
  if (!config.headers) {
    config.headers = {};
  }

  const headers = config.headers as Record<string, unknown> & {
    set?: (key: string, value: string) => void;
  };

  if (typeof headers.set === "function") {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers["Authorization"] = `Bearer ${token}`;
  }
}

function getAbsoluteRequestUrl(config: AxiosRequestConfig) {
  const requestUrl = config.url ?? "";

  try {
    if (requestUrl.startsWith("http")) {
      return new URL(requestUrl);
    }
    const base = config.baseURL ?? ENV.IDENTITY_BASE_URL;
    return new URL(requestUrl, base);
  } catch (error) {
    return null;
  }
}

function isIdentityApiRequest(config: AxiosRequestConfig) {
  const target = getAbsoluteRequestUrl(config);
  if (!target) return false;
  try {
    const base = new URL(ENV.IDENTITY_BASE_URL);
    return target.origin === base.origin && target.pathname.startsWith(base.pathname ?? "/");
  } catch (error) {
    return false;
  }
}

async function ensureValidTokens(): Promise<AuthTokens | null> {
  if (!isBrowser()) {
    return loadAuthTokens();
  }

  const tokens = loadAuthTokens();
  if (!tokens) {
    return null;
  }

  if (!isAccessTokenExpired(tokens)) {
    return tokens;
  }

  if (isRefreshTokenExpired(tokens)) {
    clearAuthTokens();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshTokens(tokens.refreshToken)
      .then((next) => {
        persistAuthTokens(next);
        return next;
      })
      .catch((error) => {
        clearAuthTokens();
        if (import.meta.env.DEV) {
          console.error("token refresh failed", error);
        }
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function handleUnauthorizedResponse(error: AxiosError) {
  const { response, config } = error;
  if (!response || !config || config._retry) {
    throw error;
  }

  config._retry = true;

  const path = getAbsoluteRequestUrl(config)?.pathname ?? "";
  if (path.includes("/auth/refresh")) {
    clearAuthTokens();
    throw error;
  }

  const tokens = loadAuthTokens();
  if (!tokens || isRefreshTokenExpired(tokens)) {
    clearAuthTokens();
    throw error;
  }

  try {
    const next = await refreshTokens(tokens.refreshToken);
    persistAuthTokens(next);
    setAuthorizationHeader(config, next.accessToken);
    return axios(config);
  } catch (refreshError) {
    clearAuthTokens();
    throw refreshError instanceof RefreshTokenError ? error : refreshError;
  }
}

export function configureIdentityInterceptors() {
  if (configured || !isBrowser()) {
    configured = true;
    return;
  }

  axios.interceptors.request.use(async (config) => {
    if (!isIdentityApiRequest(config)) {
      return config;
    }

    const path = getAbsoluteRequestUrl(config)?.pathname ?? "";
    if (path.includes("/auth/sign-in") || path.includes("/auth/refresh") || path.includes("/auth/accept-invite")) {
      return config;
    }

    const tokens = await ensureValidTokens();
    if (tokens?.accessToken) {
      setAuthorizationHeader(config, tokens.accessToken);
    }

    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const { response, config } = error;
      if (!config || !isIdentityApiRequest(config)) {
        throw error;
      }

      if (response?.status === 401) {
        return handleUnauthorizedResponse(error);
      }

      throw error;
    },
  );

  configured = true;
}

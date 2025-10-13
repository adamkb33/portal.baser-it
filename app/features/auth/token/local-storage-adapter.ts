import { TOKEN_STORAGE_KEY } from "./constants";
import { emitTokenChange } from "./token-events";
import { type AuthTokens } from "./types";

export function readTokensFromLocalStorage(): AuthTokens | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthTokens;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to parse tokens from localStorage", error);
    }
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    emitTokenChange(null);
    return null;
  }
}

export function writeTokensToLocalStorage(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    emitTokenChange(tokens);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to persist tokens to localStorage", error);
    }
  }
}

export function clearTokensFromLocalStorage() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    emitTokenChange(null);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to clear tokens from localStorage", error);
    }
  }
}

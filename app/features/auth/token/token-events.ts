import { TOKEN_STORAGE_KEY } from './constants';
import { type AuthTokens, type TokenListener } from './types';

const listeners = new Set<TokenListener>();

export function emitTokenChange(tokens: AuthTokens | null) {
  for (const listener of listeners) {
    try {
      listener(tokens);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('token listener error', error);
      }
    }
  }
}

export function subscribeToTokenChanges(listener: TokenListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function attachStorageEventListener() {
  if (typeof window === 'undefined') {
    return;
  }

  const handler = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage) {
      return;
    }

    if (event.key === null) {
      return;
    }

    if (event.key === TOKEN_STORAGE_KEY) {
      try {
        const value = event.newValue ? (JSON.parse(event.newValue) as AuthTokens) : null;
        emitTokenChange(value);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('failed to parse token storage event', error);
        }
        emitTokenChange(null);
      }
    }
  };

  window.addEventListener('storage', handler);

  return () => window.removeEventListener('storage', handler);
}

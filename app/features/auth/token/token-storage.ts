import { attachStorageEventListener, subscribeToTokenChanges } from "./token-events";
import {
  clearTokensFromLocalStorage,
  readTokensFromLocalStorage,
  writeTokensToLocalStorage,
} from "./local-storage-adapter";
import { clearTokensFromMemory, readTokensFromMemory, writeTokensToMemory } from "./memory-storage";
import { type AuthTokens, type TokenListener } from "./types";

interface TokenStorage {
  read(): AuthTokens | null;
  write(tokens: AuthTokens): void;
  clear(): void;
}

const browserStorage: TokenStorage = {
  read: readTokensFromLocalStorage,
  write: writeTokensToLocalStorage,
  clear: clearTokensFromLocalStorage,
};

const memoryStorage: TokenStorage = {
  read: readTokensFromMemory,
  write: writeTokensToMemory,
  clear: clearTokensFromMemory,
};

const storage: TokenStorage = typeof window !== "undefined" ? browserStorage : memoryStorage;

if (typeof window !== "undefined") {
  attachStorageEventListener();
}

export function loadAuthTokens(): AuthTokens | null {
  return storage.read();
}

export function persistAuthTokens(tokens: AuthTokens) {
  storage.write(tokens);
}

export function clearAuthTokens() {
  storage.clear();
}

export function withTokenListener(listener: TokenListener) {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  return subscribeToTokenChanges(listener);
}

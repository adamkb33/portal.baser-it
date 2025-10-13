import { emitTokenChange } from "./token-events";
import { type AuthTokens } from "./types";

let memoryTokens: AuthTokens | null = null;

export function readTokensFromMemory() {
  return memoryTokens;
}

export function writeTokensToMemory(tokens: AuthTokens) {
  memoryTokens = tokens;
  emitTokenChange(memoryTokens);
}

export function clearTokensFromMemory() {
  memoryTokens = null;
  emitTokenChange(null);
}

type ErrorLike = { value?: string; id?: string };

export function getFetcherErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  if (!('error' in data)) return null;

  const rawError = (data as { error?: unknown }).error;
  if (typeof rawError === 'string') return rawError;
  if (rawError && typeof rawError === 'object') {
    const error = rawError as ErrorLike;
    if (typeof error.value === 'string') return error.value;
    if (typeof error.id === 'string') return error.id;
  }
  return null;
}

// Generic Wrapper
import type { ApiError, ApiMeta } from './core';
import type { DateTime } from './primitives';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  meta?: ApiMeta;
  timestamp: DateTime;
}

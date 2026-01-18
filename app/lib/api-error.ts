import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import type { ApiClientError } from '~/api/clients/http';

type ApiErrorItem = {
  code?: string;
  message?: string;
  field?: string;
  details?: string;
};

export type RouteErrorPayload = {
  message: string;
  code?: string;
  details?: string;
  fieldErrors?: Record<string, string[]>;
};

export type RouteData<T extends Record<string, unknown>, E extends Record<string, unknown> = {}> =
  | ({ ok: true } & T)
  | ({ ok: false; error: RouteErrorPayload } & E);

type RouteArgs = LoaderFunctionArgs | ActionFunctionArgs;

type ErrorHandlingOptions = {
  fallbackMessage?: string;
  status?: number;
  log?: boolean;
};

const DEFAULT_MESSAGE = 'En feil oppstod';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isApiClientError = (error: unknown): error is ApiClientError & { body?: { message?: string; errors?: ApiErrorItem[] } } =>
  isRecord(error) && ('body' in error || 'status' in error);

const toFieldErrors = (errors?: ApiErrorItem[]) => {
  if (!errors || errors.length === 0) return undefined;

  return errors.reduce<Record<string, string[]>>((acc, error) => {
    if (!error.field || !error.message) return acc;
    if (!acc[error.field]) acc[error.field] = [];
    acc[error.field].push(error.message);
    return acc;
  }, {});
};

const normalizeApiError = (error: unknown, fallbackMessage = DEFAULT_MESSAGE) => {
  if (error instanceof Response) {
    return {
      message: error.statusText || fallbackMessage,
      status: error.status || 500,
    };
  }

  if (typeof error === 'string') {
    return { message: error || fallbackMessage };
  }

  if (isApiClientError(error)) {
    const body = error.body ?? {};
    const errors = Array.isArray(body.errors) ? body.errors : undefined;
    const firstError = errors?.[0];

    return {
      message: body.message || firstError?.message || fallbackMessage,
      code: firstError?.code,
      details: firstError?.details,
      fieldErrors: toFieldErrors(errors),
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message || fallbackMessage };
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return { message: error.message || fallbackMessage };
  }

  return { message: fallbackMessage };
};

export const getRouteError = (error: unknown, options: ErrorHandlingOptions = {}) => {
  const normalized = normalizeApiError(error, options.fallbackMessage);
  const status = options.status ?? normalized.status ?? 400;
  const payload: RouteErrorPayload = {
    message: normalized.message,
    code: normalized.code,
    details: normalized.details,
    fieldErrors: normalized.fieldErrors,
  };

  return { payload, status };
};

export const handleRouteError = (error: unknown, args?: RouteArgs, options: ErrorHandlingOptions = {}) => {
  const { payload, status } = getRouteError(error, options);

  if (options.log !== false) {
    const requestInfo = args?.request ? `${args.request.method} ${args.request.url}` : 'Unknown request';
    console.error(`[route-error] ${requestInfo}`, error);
  }

  return data<RouteData<Record<string, never>>>({ ok: false, error: payload }, { status });
};

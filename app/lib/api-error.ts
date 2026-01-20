import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';

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

const toFieldErrors = (errors?: ApiErrorItem[]) => {
  if (!errors || errors.length === 0) return undefined;

  return errors.reduce<Record<string, string[]>>((acc, error) => {
    if (!error.field || !error.message) return acc;
    if (!acc[error.field]) acc[error.field] = [];
    acc[error.field].push(error.message);
    return acc;
  }, {});
};


export const handleRouteError = (error: unknown, args?: RouteArgs, options: ErrorHandlingOptions = {}) => {
  const { payload, status } = getRouteError(error, options);

  if (options.log !== false) {
    const requestInfo = args?.request ? `${args.request.method} ${args.request.url}` : 'Unknown request';
    console.error(`[route-error] ${requestInfo}`, error);
  }

  return data<RouteData<Record<string, never>>>({ ok: false, error: payload }, { status });
};

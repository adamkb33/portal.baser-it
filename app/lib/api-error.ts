export type RouteErrorPayload = {
  message: string;
  code?: string;
  details?: string;
  fieldErrors?: Record<string, string[]>;
};

export type RouteData<T extends Record<string, unknown>, E extends Record<string, unknown> = {}> =
  | ({ ok: true } & T)
  | ({ ok: false; error: RouteErrorPayload } & E);

export type ErrorPayloadResult = {
  message: string;
  status?: number;
};


export const resolveErrorPayload = (error: unknown, fallbackMessage: string): ErrorPayloadResult => {
  const responseError = error as { response?: { status?: number; data?: { message?: string } } };
  const message = responseError?.response?.data?.message;
  if (message) {
    console.error(message);
  }
  return {
    message: message || fallbackMessage,
    status: responseError?.response?.status,
  };
};

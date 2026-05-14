// lib/flash.server.ts
import { createCookieSessionStorage, redirect } from 'react-router';
import type { ApiMessage } from '~/api/generated/booking';

const { getSession, commitSession } = createCookieSessionStorage({
  cookie: {
    name: '__flash',
    httpOnly: true,
    maxAge: 5,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'default-secret'],
    secure: process.env.NODE_ENV === 'production',
  },
});

export type FlashMessage = {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
  messageId?: ApiMessage['id'];
};

type FlashTextInput = string | ApiMessage;

function normalizeFlashMessage(type: FlashMessage['type'], text: FlashTextInput): FlashMessage {
  if (typeof text === 'string') {
    return { type, text };
  }

  return {
    type,
    text: text.value || text.id,
    messageId: text.id,
  };
}

export async function setFlashMessage(request: Request, message: FlashMessage) {
  const session = await getSession(request.headers.get('Cookie'));
  session.flash('message', message);
  return commitSession(session);
}

export async function getFlashMessage(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const message = session.get('message') as FlashMessage | null;
  return {
    message,
    headers: await commitSession(session),
  };
}

export async function redirectWithFlash(
  request: Request,
  url: string,
  message: FlashMessage,
  additionalHeaders?: HeadersInit,
) {
  const flashCookie = await setFlashMessage(request, message);
  const headers = new Headers(additionalHeaders);
  headers.append('Set-Cookie', flashCookie);

  return redirect(url, { headers });
}

export async function redirectWithSuccess(
  request: Request,
  url: string,
  text: FlashTextInput,
  additionalHeaders?: HeadersInit,
) {
  return redirectWithFlash(request, url, normalizeFlashMessage('success', text), additionalHeaders);
}

export async function redirectWithError(request: Request, url: string, text: FlashTextInput, additionalHeaders?: HeadersInit) {
  return redirectWithFlash(request, url, normalizeFlashMessage('error', text), additionalHeaders);
}

export async function redirectWithInfo(request: Request, url: string, text: FlashTextInput, additionalHeaders?: HeadersInit) {
  return redirectWithFlash(request, url, normalizeFlashMessage('info', text), additionalHeaders);
}

export async function redirectWithWarning(
  request: Request,
  url: string,
  text: FlashTextInput,
  additionalHeaders?: HeadersInit,
) {
  return redirectWithFlash(request, url, normalizeFlashMessage('warning', text), additionalHeaders);
}

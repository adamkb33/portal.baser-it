// lib/flash.server.ts
import { createCookieSessionStorage, redirect } from 'react-router';

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
};

export async function setFlashMessage(request: Request, message: FlashMessage) {
  const session = await getSession(request.headers.get('Cookie'));
  session.flash('message', message);
  return commitSession(session);
}

export async function getFlashMessage(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));
  const message = session.get('message') as FlashMessage | undefined;
  return {
    message,
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  };
}

export async function redirectWithFlash(request: Request, url: string, message: FlashMessage) {
  return redirect(url, {
    headers: {
      'Set-Cookie': await setFlashMessage(request, message),
    },
  });
}

export async function redirectWithSuccess(request: Request, url: string, text: string) {
  return redirectWithFlash(request, url, { type: 'success', text });
}

export async function redirectWithError(request: Request, url: string, text: string) {
  return redirectWithFlash(request, url, { type: 'error', text });
}

export async function redirectWithInfo(request: Request, url: string, text: string) {
  return redirectWithFlash(request, url, { type: 'info', text });
}

export async function redirectWithWarning(request: Request, url: string, text: string) {
  return redirectWithFlash(request, url, { type: 'warning', text });
}

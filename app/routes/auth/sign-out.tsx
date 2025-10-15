import * as React from 'react';
import { Link, useFetcher, useNavigate, useSearchParams } from 'react-router';

import { signOut, SignOutRequestError } from '@/features/auth/api/sign-out.server';
import { clearAuthTokens, loadAuthTokens } from '@/features/auth/token/token-storage';
import { tokensToAuthenticatedPayload } from '@/features/auth/token/token-payload';
import type { Route } from './+types/sign-out';

interface ActionData {
  success?: boolean;
  error?: string;
  redirectTo?: string;
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method.toUpperCase() !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } });
  }

  const formData = await request.formData();
  const userIdEntry = formData.get('userId');
  const redirectToEntry = formData.get('redirectTo');

  const redirectTo = sanitizeRedirect(typeof redirectToEntry === 'string' ? redirectToEntry : null);
  const userId = Number(typeof userIdEntry === 'string' ? userIdEntry : '');

  if (!Number.isFinite(userId) || userId <= 0) {
    return jsonResponse({ success: false, error: 'Invalid user' }, { status: 400 });
  }

  try {
    await signOut(userId);
    return jsonResponse({ success: true, redirectTo }, { status: 200 });
  } catch (error) {
    if (error instanceof SignOutRequestError) {
      return jsonResponse({ success: false, error: error.message, redirectTo }, { status: 500 });
    }

    throw error;
  }
}

export default function AuthSignOut() {
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [attempt, setAttempt] = React.useState(1);
  const dispatchedAttemptRef = React.useRef(0);

  const redirectTarget = React.useMemo(() => sanitizeRedirect(searchParams.get('redirectTo')), [searchParams]);
  const isProcessing = fetcher.state !== 'idle';
  const errorMessage = fetcher.data?.error;
  const resolvedRedirect = fetcher.data?.redirectTo ?? redirectTarget;

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (fetcher.state !== 'idle') {
      return;
    }

    if (dispatchedAttemptRef.current === attempt) {
      return;
    }

    dispatchedAttemptRef.current = attempt;

    const tokens = loadAuthTokens();
    const payload = tokensToAuthenticatedPayload(tokens);

    if (!tokens || !payload?.id) {
      clearAuthTokens();
      navigate(redirectTarget, { replace: true });
      return;
    }

    const formData = new FormData();
    formData.set('userId', String(payload.id));
    formData.set('redirectTo', redirectTarget);

    fetcher.submit(formData, { method: 'post' });
  }, [attempt, fetcher, navigate, redirectTarget]);

  React.useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) {
      return;
    }

    clearAuthTokens();

    if (fetcher.data.success) {
      navigate(fetcher.data.redirectTo ?? redirectTarget, { replace: true });
    }
  }, [fetcher.data, fetcher.state, navigate, redirectTarget]);

  const handleRetry = React.useCallback(() => {
    if (fetcher.state !== 'idle') {
      return;
    }
    setAttempt((value) => value + 1);
  }, [fetcher.state]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-12 text-center">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Signing out</h1>
        {isProcessing && !errorMessage ? (
          <p className="text-sm text-muted-foreground">Please wait while we securely end your session.</p>
        ) : errorMessage ? (
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Finishing up…</p>
        )}
      </header>

      {errorMessage ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your local session has been cleared. You can try again or continue to the sign-in page.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100"
              disabled={isProcessing}
            >
              Try again
            </button>
            <Link to={resolvedRedirect} className="text-sm text-primary hover:underline">
              Go to sign in
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">You will be redirected shortly.</p>
      )}
    </div>
  );
}

function sanitizeRedirect(target: string | null, fallback = '/auth/sign-in') {
  if (!target) return fallback;
  if (!target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }
  return target;
}

function jsonResponse(data: ActionData, init: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

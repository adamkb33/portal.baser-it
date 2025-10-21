import { Link, useFetcher } from 'react-router';

interface ActionData {
  success?: boolean;
  error?: string;
  redirectTo?: string;
}

export default function AuthSignOut() {
  const fetcher = useFetcher<ActionData>();

  const isProcessing = fetcher.state !== 'idle';
  const errorMessage = fetcher.data?.error;

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
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100"
              disabled={isProcessing}
            >
              Try again
            </button>
            <Link to={'ROUTES_SHAPE'} className="text-sm text-primary hover:underline">
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

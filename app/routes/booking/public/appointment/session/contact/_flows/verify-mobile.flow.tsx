import * as React from 'react';
import { useFetcher, useLocation, useRevalidator } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingErrorBanner, BookingSection, BookingStepHeader } from '../../../_components/booking-layout';
import { API_ROUTES_MAP } from '~/lib/route-tree';
import { CONTACT_VERIFICATION_TOKEN_STORAGE_KEY } from '../_forms/session-keys';
import { getFetcherErrorMessage } from '../_utils/fetcher-error';

const CODE_LENGTH = 6;

type VerifyMobileFlowProps = {
  email?: string | null;
};

export function VerifyMobileFlow({ email }: VerifyMobileFlowProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const resendFetcher = useFetcher();
  const location = useLocation();
  const action = API_ROUTES_MAP['auth.verify-mobile'].url;
  const resendAction = API_ROUTES_MAP['auth.resend-verification'].url;
  const [verificationSessionToken, setVerificationSessionToken] = React.useState('');
  const errorMessage =
    typeof fetcher.data === 'object' && fetcher.data && 'error' in fetcher.data
      ? String((fetcher.data as { error?: unknown }).error)
      : null;
  const successMessage =
    typeof fetcher.data === 'object' &&
    fetcher.data &&
    'success' in fetcher.data &&
    (fetcher.data as { success?: boolean }).success
      ? 'Mobilnummeret er bekreftet.'
      : null;
  const resendMessage =
    typeof resendFetcher.data === 'object' && resendFetcher.data && 'message' in resendFetcher.data
      ? String((resendFetcher.data as { message?: unknown }).message)
      : null;
  const bannerMessage = getFetcherErrorMessage(fetcher.data) ?? getFetcherErrorMessage(resendFetcher.data);
  const [code, setCode] = React.useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedRef = React.useRef<string | null>(null);

  const focusIndex = React.useCallback((index: number) => {
    const next = inputRefs.current[index];
    if (next) {
      next.focus();
      next.select();
    }
  }, []);

  const updateCodeAt = React.useCallback(
    (index: number, value: string) => {
      const cleaned = value.replace(/\D/g, '');
      const nextCode = [...code];
      nextCode[index] = cleaned;
      setCode(nextCode);
    },
    [code],
  );

  const handleChange = React.useCallback(
    (index: number, value: string) => {
      if (!value) {
        updateCodeAt(index, '');
        return;
      }

      const digits = value.replace(/\D/g, '').split('');
      if (!digits.length) return;

      const nextCode = [...code];
      let cursor = index;
      digits.forEach((digit) => {
        if (cursor >= CODE_LENGTH) return;
        nextCode[cursor] = digit;
        cursor += 1;
      });

      setCode(nextCode);
      if (cursor < CODE_LENGTH) {
        focusIndex(cursor);
      }
    },
    [code, focusIndex],
  );

  const handleKeyDown = React.useCallback(
    (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        if (code[index]) {
          updateCodeAt(index, '');
          return;
        }
        if (index > 0) {
          updateCodeAt(index - 1, '');
          focusIndex(index - 1);
        }
      }
      if (event.key === 'ArrowLeft' && index > 0) {
        focusIndex(index - 1);
      }
      if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
        focusIndex(index + 1);
      }
    },
    [code, focusIndex, updateCodeAt],
  );

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const text = event.clipboardData.getData('text');
      if (!text) return;
      event.preventDefault();
      const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      if (!digits.length) return;
      const nextCode = Array(CODE_LENGTH).fill('');
      digits.forEach((digit, index) => {
        nextCode[index] = digit;
      });
      setCode(nextCode);
      focusIndex(Math.min(digits.length, CODE_LENGTH - 1));
    },
    [focusIndex],
  );

  const codeValue = code.join('');
  const isComplete = code.every((digit) => digit.length === 1);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(CONTACT_VERIFICATION_TOKEN_STORAGE_KEY);
    if (stored) {
      setVerificationSessionToken(stored);
      return;
    }
    const tokenFromUrl = new URLSearchParams(location.search).get('verificationSessionToken');
    if (tokenFromUrl) {
      window.sessionStorage.setItem(CONTACT_VERIFICATION_TOKEN_STORAGE_KEY, tokenFromUrl);
      setVerificationSessionToken(tokenFromUrl);
    }
  }, [location.search]);

  React.useEffect(() => {
    if (typeof resendFetcher.data !== 'object' || !resendFetcher.data) return;
    const data = resendFetcher.data as {
      verificationSessionToken?: string;
      data?: { verificationSessionToken?: string };
    };
    const nextToken = data.verificationSessionToken ?? data.data?.verificationSessionToken;
    if (!nextToken || nextToken === verificationSessionToken) return;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CONTACT_VERIFICATION_TOKEN_STORAGE_KEY, nextToken);
    }
    setVerificationSessionToken(nextToken);
  }, [resendFetcher.data, verificationSessionToken]);

  React.useEffect(() => {
    console.log('[verify-mobile] state', {
      code,
      codeValue,
      isComplete,
      fetcherState: fetcher.state,
      lastSubmitted: lastSubmittedRef.current,
    });
  }, [code, codeValue, fetcher.state, isComplete]);

  React.useEffect(() => {
    if (!isComplete) {
      lastSubmittedRef.current = null;
      return;
    }
    if (fetcher.state !== 'idle') return;
    if (lastSubmittedRef.current === codeValue) return;
    if (!verificationSessionToken) {
      console.log('[verify-mobile] submit blocked: missing verificationSessionToken');
      return;
    }

    console.log('[verify-mobile] auto submit', {
      code: codeValue,
      verificationSessionToken,
    });
    fetcher.submit({ code: codeValue, verificationSessionToken }, { method: 'post', action });
    lastSubmittedRef.current = codeValue;
  }, [action, codeValue, fetcher, isComplete, verificationSessionToken]);

  React.useEffect(() => {
    if (typeof fetcher.data !== 'object' || !fetcher.data) return;
    const data = fetcher.data as { success?: boolean; nextStep?: string | null };
    if (!data.success) return;
    if (!data.nextStep || data.nextStep === 'VERIFY_MOBILE') return;
    revalidator.revalidate();
  }, [fetcher.data, revalidator]);

  return (
    <>
      <BookingStepHeader
        label="Kontakt"
        title="Bekreft e-post"
        description="Skriv inn 6-sifret kode vi har sendt til e-posten din."
      />
      {bannerMessage ? <BookingErrorBanner message={bannerMessage} sticky /> : null}
      <BookingSection title="Bekreftelseskode" variant="elevated">
        <fetcher.Form method="post" action={action} className="space-y-4">
          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
              <Input
                key={index}
                name={`code_${index}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={code[index]}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                className="h-12 text-center text-lg font-semibold"
                aria-label={`Kode siffer ${index + 1}`}
              />
            ))}
          </div>
          <input type="hidden" name="verificationSessionToken" value={verificationSessionToken} />
          <input type="hidden" name="code" value={codeValue} />
          <Button type="submit">Bekreft</Button>
        </fetcher.Form>
        <resendFetcher.Form method="post" action={resendAction} className="space-y-2">
          <input type="hidden" name="verificationSessionToken" value={verificationSessionToken} />
          {email ? <input type="hidden" name="email" value={email} /> : null}
          <Button type="submit" variant="outline">
            Send på nytt
          </Button>
          {resendMessage ? (
            <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-700">
              {resendMessage}
            </div>
          ) : null}
        </resendFetcher.Form>
      </BookingSection>
    </>
  );
}

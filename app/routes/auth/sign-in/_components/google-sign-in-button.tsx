import * as React from 'react';
import { ENV } from '~/api/config/env';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  width?: number | string;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

const googleClientId = ENV.GOOGLE_CLIENT_ID;

type GoogleSignInButtonProps = {
  onCredential: (token: string) => void;
  disabled: boolean;
};

const GOOGLE_BUTTON_MAX_WIDTH = 400;

export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLDivElement | null>(null);
  const onCredentialRef = React.useRef(onCredential);
  const hasRenderedButtonRef = React.useRef(false);
  const [scriptReady, setScriptReady] = React.useState(false);

  React.useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  React.useEffect(() => {
    if (!googleClientId || disabled) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }

    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-gsi]');
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        setScriptReady(true);
        return;
      }
      const handleLoad = () => {
        existingScript.dataset.loaded = 'true';
        setScriptReady(true);
      };
      existingScript.addEventListener('load', handleLoad);
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = () => {
      script.dataset.loaded = 'true';
      setScriptReady(true);
    };
    document.head.appendChild(script);
  }, [disabled]);

  React.useEffect(() => {
    if (
      !scriptReady ||
      !googleClientId ||
      !containerRef.current ||
      !buttonRef.current ||
      hasRenderedButtonRef.current
    ) {
      return;
    }
    if (!window.google?.accounts?.id) {
      return;
    }

    const measuredWidth = Math.floor(containerRef.current.getBoundingClientRect().width);
    const buttonWidth = Math.min(Math.max(measuredWidth || GOOGLE_BUTTON_MAX_WIDTH, 1), GOOGLE_BUTTON_MAX_WIDTH);

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) {
          onCredentialRef.current(response.credential);
        }
      },
      cancel_on_tap_outside: true,
    });

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: buttonWidth,
      text: 'continue_with',
    });
    hasRenderedButtonRef.current = true;
  }, [scriptReady]);

  return (
    <div ref={containerRef} className="w-full max-w-[400px] space-y-2">
      <div ref={buttonRef} className="google-sign-in-button h-11 w-full overflow-hidden" aria-disabled={disabled} />
      <p className="text-xs text-center text-form-text-muted">Fortsett med Google-kontoen din.</p>
    </div>
  );
}

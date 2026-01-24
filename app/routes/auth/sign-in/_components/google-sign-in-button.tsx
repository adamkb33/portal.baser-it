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

export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  const buttonRef = React.useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);

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
    if (!scriptReady || !googleClientId || !buttonRef.current) {
      return;
    }
    if (!window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        }
      },
      cancel_on_tap_outside: true,
    });

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'continue_with',
    });
  }, [onCredential, scriptReady]);

  return (
    <div className="space-y-2">
      <div ref={buttonRef} aria-disabled={disabled} />
      <p className="text-xs text-center text-form-text-muted">Fortsett med Google-kontoen din.</p>
    </div>
  );
}

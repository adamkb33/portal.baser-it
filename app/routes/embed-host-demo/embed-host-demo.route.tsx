import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { EMBED_THEME_KEYS, EMBED_THEME_LABELS, isEmbedThemeKey } from '~/lib/embed-shell';

function toPositiveInt(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1;
  }
  return parsed;
}

export default function EmbedHostDemoRoute() {
  const [searchParams] = useSearchParams();
  const companyId = toPositiveInt(searchParams.get('companyId'));
  const start = searchParams.get('start') || 'contact';
  const selectedTheme = isEmbedThemeKey(searchParams.get('theme')) ? searchParams.get('theme') : 'pitell';
  const [nonce, setNonce] = useState(0);
  const [lastStepPath, setLastStepPath] = useState<string | null>(null);
  const [lastStepName, setLastStepName] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string>('');

  const embedSrc = `/embed?companyId=${companyId}&start=${encodeURIComponent(start)}&theme=${selectedTheme}${nonce ? `&nonce=${nonce}` : ''}`;

  useEffect(() => {
    setIframeSrc(embedSrc);
  }, [embedSrc]);

  useEffect(() => {
    const storedPath = window.localStorage.getItem('embed-demo:last-step-path');
    const storedStep = window.localStorage.getItem('embed-demo:last-step-name');
    if (storedPath) setLastStepPath(storedPath);
    if (storedStep) setLastStepName(storedStep);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;
      const payload = event.data as { type?: string; path?: string; step?: string };
      if (payload.type !== 'embed:step-changed') return;
      if (!payload.path || !payload.step) return;

      window.localStorage.setItem('embed-demo:last-step-path', payload.path);
      window.localStorage.setItem('embed-demo:last-step-name', payload.step);
      setLastStepPath(payload.path);
      setLastStepName(payload.step);
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const resumeHref = lastStepPath && lastStepPath.startsWith('/booking/public') ? lastStepPath : null;

  const resetAndRestartHref = `/embed?companyId=${companyId}&start=${encodeURIComponent(start)}&theme=${selectedTheme}&reset=1&nonce=${Date.now()}`;

  const snippet = useMemo(
    () => `<div id="pitell-booking-embed" style="width:100%;min-height:760px;"></div>
<script>
  (function () {
    var container = document.getElementById('pitell-booking-embed');
    var iframe = document.createElement('iframe');
    iframe.src = '${embedSrc}';
    iframe.title = 'Booking';
    iframe.loading = 'lazy';
    iframe.style.width = '100%';
    iframe.style.minHeight = '760px';
    iframe.style.border = '0';
    container.appendChild(iframe);
  })();
</script>`,
    [embedSrc],
  );

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#0f172a]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 lg:px-8">
        <header className="rounded-2xl border border-[#d7e3f4] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563eb]">Demo Host Website</p>
          <h1 className="mt-2 text-2xl font-bold">Embedded Booking Test Page</h1>
          <p className="mt-2 text-sm text-[#475569]">
            This route simulates another website embedding your booking flow.
          </p>
          <p className="mt-3 text-xs text-[#64748b]">
            Test URL: <code>/embed-host-demo?companyId={companyId}&start={start}&theme={selectedTheme}</code>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-[#cbdaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e293b] hover:bg-[#eff6ff]"
              onClick={() => setNonce(Date.now())}
            >
              Restart from Contact
            </button>
            <a
              href={resetAndRestartHref}
              className="inline-flex items-center rounded-md border border-[#cbdaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e293b] hover:bg-[#eff6ff]"
            >
              Reset Session + Restart
            </a>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-[#cbdaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e293b] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (!resumeHref) return;
                window.localStorage.setItem('embed-demo:last-step-path', resumeHref);
                setLastStepPath(resumeHref);
                setIframeSrc(resumeHref);
              }}
              disabled={!resumeHref}
            >
              Resume Last Step
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-[#cbdaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e293b] hover:bg-[#eff6ff]"
              onClick={() => {
                window.localStorage.removeItem('embed-demo:last-step-path');
                window.localStorage.removeItem('embed-demo:last-step-name');
                setLastStepPath(null);
                setLastStepName(null);
              }}
            >
              Clear Local State
            </button>
          </div>
          <p className="mt-2 text-xs text-[#64748b]">
            Persisted step: <code>{lastStepName ?? 'none'}</code>{' '}
            {lastStepPath ? <span>({lastStepPath})</span> : null}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {EMBED_THEME_KEYS.map((themeKey) => {
              const active = themeKey === selectedTheme;
              return (
                <a
                  key={themeKey}
                  href={`/embed-host-demo?companyId=${companyId}&start=${encodeURIComponent(start)}&theme=${themeKey}`}
                  className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[#0f172a] bg-[#0f172a] text-white'
                      : 'border-[#cbdaf0] bg-white text-[#1e293b] hover:bg-[#eff6ff]'
                  }`}
                >
                  {EMBED_THEME_LABELS[themeKey]}
                </a>
              );
            })}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-[#d7e3f4] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Live Embedded Booking</h2>
            <p className="mt-1 text-sm text-[#475569]">
              Iframe source: <code>{embedSrc}</code>
            </p>
            <div className="mt-4 rounded-xl border border-[#cbdaf0] bg-[#f8fbff] p-2">
              <iframe
                src={iframeSrc}
                title="Pitell Booking Embed Demo"
                loading="lazy"
                className="h-[820px] w-full rounded-lg border-0 bg-white"
              />
            </div>
          </article>

          <article className="rounded-2xl border border-[#d7e3f4] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Copy-Paste Snippet</h2>
            <p className="mt-1 text-sm text-[#475569]">
              This is the host-side code equivalent for this demo page.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-[#0b1220] p-4 text-xs leading-5 text-[#dbeafe]">
              <code>{snippet}</code>
            </pre>
          </article>
        </section>
      </div>
    </main>
  );
}

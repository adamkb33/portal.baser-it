import * as React from 'react';
import { Outlet, useLocation, useRouteLoaderData } from 'react-router';
import type { loader as rootLayoutLoader } from '~/routes/root.layout';

export default function EmbedBookingLayout() {
  const location = useLocation();
  const rootLoaderData = useRouteLoaderData<typeof rootLayoutLoader>('root.layout');
  const parentOrigin = rootLoaderData?.embedConfig.parentOrigin ?? null;
  const lastHeightRef = React.useRef(0);
  const animationFrameRef = React.useRef<number | null>(null);
  const resizeReasonRef = React.useRef<'init' | 'step' | 'content'>('init');

  const postEmbedMessage = React.useCallback(
    (message: Record<string, unknown>) => {
      window.parent?.postMessage(
        {
          path: `${location.pathname}${location.search}`,
          ...message,
        },
        parentOrigin ?? '*',
      );
    },
    [location.pathname, location.search, parentOrigin],
  );

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlStyle = html.getAttribute('style');
    const previousBodyStyle = body.getAttribute('style');

    html.style.background = 'transparent';
    html.style.height = 'auto';
    html.style.minHeight = '0';
    html.style.overflow = 'visible';
    html.style.colorScheme = 'normal';

    body.style.background = 'transparent';
    body.style.margin = '0';
    body.style.height = 'auto';
    body.style.minHeight = '0';
    body.style.overflow = 'visible';

    return () => {
      if (previousHtmlStyle === null) {
        html.removeAttribute('style');
      } else {
        html.setAttribute('style', previousHtmlStyle);
      }

      if (previousBodyStyle === null) {
        body.removeAttribute('style');
      } else {
        body.setAttribute('style', previousBodyStyle);
      }
    };
  }, []);

  const publishHeight = React.useCallback(() => {
    const html = document.documentElement;
    const body = document.body;
    const height = Math.ceil(
      Math.max(
        html.getBoundingClientRect().height,
        body.getBoundingClientRect().height,
        html.scrollHeight,
        body.scrollHeight,
      ),
    );

    if (Math.abs(height - lastHeightRef.current) < 1) {
      return;
    }

    lastHeightRef.current = height;
    postEmbedMessage({
      type: 'embed:resize',
      height,
      reason: resizeReasonRef.current,
    });
    resizeReasonRef.current = 'content';
  }, [postEmbedMessage]);

  const scheduleHeightPublish = React.useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      publishHeight();
    });
  }, [publishHeight]);

  React.useEffect(() => {
    postEmbedMessage({
      type: 'embed:ready',
    });
  }, [postEmbedMessage]);

  React.useEffect(() => {
    if (resizeReasonRef.current !== 'init') {
      resizeReasonRef.current = 'step';
    }

    postEmbedMessage({
      type: 'embed:step-changed',
    });
    scheduleHeightPublish();

    const timeout = window.setTimeout(() => publishHeight(), 150);
    return () => window.clearTimeout(timeout);
  }, [postEmbedMessage, publishHeight, scheduleHeightPublish]);

  React.useEffect(() => {
    scheduleHeightPublish();
    const observer = new ResizeObserver(() => scheduleHeightPublish());
    observer.observe(document.documentElement);
    observer.observe(document.body);

    const handleWindowResize = () => scheduleHeightPublish();
    const handleResourceLoad = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        scheduleHeightPublish();
      }
    };

    document.fonts?.ready.then(scheduleHeightPublish);
    window.addEventListener('resize', handleWindowResize);
    document.addEventListener('load', handleResourceLoad, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      document.removeEventListener('load', handleResourceLoad, true);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scheduleHeightPublish]);

  return (
    <div
      id="embed-root"
      data-embed-mode="fragment"
      className="flow-root w-full bg-booking-background text-booking-text [--booking-step-min-height:auto] [container-name:embed] [container-type:inline-size]"
    >
      <Outlet />
    </div>
  );
}

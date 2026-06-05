import * as React from 'react';
import { Outlet, useLocation } from 'react-router';

export default function EmbedBookingLayout() {
  const location = useLocation();
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const lastHeightRef = React.useRef<number | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  const postEmbedMessage = React.useCallback(
    (message: Record<string, unknown>) => {
      window.parent?.postMessage(
        {
          path: `${location.pathname}${location.search}`,
          ...message,
        },
        '*',
      );
    },
    [location.pathname, location.search],
  );

  const publishHeight = React.useCallback(
    (force = false) => {
      const target = contentRef.current;
      if (!target) return;

      const rectHeight = target.getBoundingClientRect().height;
      const scrollHeight = target.scrollHeight;
      const height = Math.ceil(Math.max(rectHeight, scrollHeight));

      if (!force && lastHeightRef.current === height) {
        return;
      }

      lastHeightRef.current = height;
      postEmbedMessage({
        type: 'embed:resize',
        height,
      });
    },
    [postEmbedMessage],
  );

  const scheduleHeightPublish = React.useCallback(
    (force = false) => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        publishHeight(force);
      });
    },
    [publishHeight],
  );

  React.useEffect(() => {
    postEmbedMessage({
      type: 'embed:ready',
    });
  }, [postEmbedMessage]);

  React.useEffect(() => {
    postEmbedMessage({
      type: 'embed:step-changed',
    });
    scheduleHeightPublish(true);

    const timeout = window.setTimeout(() => publishHeight(true), 150);
    return () => window.clearTimeout(timeout);
  }, [postEmbedMessage, publishHeight, scheduleHeightPublish]);

  React.useEffect(() => {
    const target = contentRef.current;
    if (!target) return;

    scheduleHeightPublish(true);
    const observer = new ResizeObserver(() => scheduleHeightPublish());
    observer.observe(target);

    const handleWindowResize = () => scheduleHeightPublish(true);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scheduleHeightPublish]);

  return (
    <div ref={wrapperRef} className="bg-background px-3 py-4 text-text-primary sm:px-4">
      <div ref={contentRef} className="mx-auto w-full max-w-4xl">
        <Outlet />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router';

export function AppointmentsView() {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [offsetFromTop, setOffsetFromTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateMeasurements = () => {
      setViewportHeight(window.innerHeight);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const offsetTop = rect.top + scrollTop;

        setOffsetFromTop(offsetTop);
      }
    };

    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    window.addEventListener('scroll', updateMeasurements);

    return () => {
      window.removeEventListener('resize', updateMeasurements);
      window.removeEventListener('scroll', updateMeasurements);
    };
  }, []);

  const componentHeight = Math.max(0, viewportHeight - offsetFromTop);

  return (
    <div
      ref={containerRef}
      className="flex h-screen flex-col overflow-hidden bg-background"
      style={componentHeight ? { height: `${componentHeight}px` } : undefined}
    >
      <main ref={scrollRef} className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
      <div id="booking-mobile-footer" className="flex-shrink-0" />
    </div>
  );
}

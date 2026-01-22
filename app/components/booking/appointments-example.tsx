import { useEffect, useRef, useState } from 'react';

export function AppointmentsExample() {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [offsetFromTop, setOffsetFromTop] = useState(0);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMeasurements = () => {
      setViewportHeight(window.innerHeight);

      if (componentRef.current) {
        const rect = componentRef.current.getBoundingClientRect();
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

  const componentHeight = viewportHeight - offsetFromTop;

  return (
    <div
      ref={componentRef}
      className="flex flex-col"
      style={{ height: `${componentHeight}px` }}
    >
      <header className="bg-gray-800 p-4 text-white">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="mt-2 text-sm">Viewport Height: {viewportHeight}px</p>
          <p className="text-sm">Offset from top: {offsetFromTop}px</p>
          <p className="text-sm">Component Height: {componentHeight}px</p>
        </div>
      </header>

      <main className="container mx-auto flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <h2 className="mb-4 text-xl font-semibold">Upcoming Appointments</h2>

          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold">Appointment #{i + 1}</h3>
              <p className="mt-2 text-gray-600">Date: January {(i % 28) + 1}, 2026</p>
              <p className="text-gray-600">Time: {9 + (i % 8)}:00 AM</p>
              <p className="mt-2 text-gray-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-800 p-4 text-white">
        <div className="container mx-auto text-center">
          <p className="text-sm">© 2026 Appointments App</p>
        </div>
      </footer>
    </div>
  );
}

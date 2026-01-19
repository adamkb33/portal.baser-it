import { useState, useEffect, useRef } from 'react';

export default function AppointmentsRoute() {
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
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex-shrink-0">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm mt-2">Viewport Height: {viewportHeight}px</p>
          <p className="text-sm">Offset from top: {offsetFromTop}px</p>
          <p className="text-sm">Component Height: {componentHeight}px</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          
          {/* Sample appointment cards */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-lg">Appointment #{i + 1}</h3>
              <p className="text-gray-600 mt-2">Date: January {(i % 28) + 1}, 2026</p>
              <p className="text-gray-600">Time: {9 + (i % 8)}:00 AM</p>
              <p className="text-gray-500 mt-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 flex-shrink-0">
        <div className="container mx-auto text-center">
          <p className="text-sm">© 2026 Appointments App</p>
        </div>
      </footer>
    </div>
  );
}
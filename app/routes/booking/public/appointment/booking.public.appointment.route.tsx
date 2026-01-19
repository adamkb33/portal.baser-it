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
      className="booking-page"
      style={{ height: `${componentHeight}px` }}
    >
      {/* Header */}
      <header className="booking-header">
        <div className="booking-header-inner">
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-navbar-text-muted mt-2">Viewport Height: {viewportHeight}px</p>
          <p className="text-sm text-navbar-text-muted">Offset from top: {offsetFromTop}px</p>
          <p className="text-sm text-navbar-text-muted">Component Height: {componentHeight}px</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="booking-main">
        <div className="booking-container booking-stack">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          
          {/* Sample appointment cards */}
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="booking-card">
              <h3 className="font-semibold text-lg">Appointment #{i + 1}</h3>
              <p className="text-muted-foreground mt-2">Date: January {(i % 28) + 1}, 2026</p>
              <p className="text-muted-foreground">Time: {9 + (i % 8)}:00 AM</p>
              <p className="text-muted-foreground/80 mt-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="booking-footer">
        <div className="booking-footer-inner">
          <p className="text-sm">© 2026 Appointments App</p>
        </div>
      </footer>
    </div>
  );
}
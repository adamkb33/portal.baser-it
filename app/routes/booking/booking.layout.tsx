import * as React from 'react';
import { Outlet, useLocation } from 'react-router';
import { Heart as HeartIcon } from 'lucide-react';

export default function BookingLayout() {
  const location = useLocation();
  const [showHearts, setShowHearts] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setShowHearts(sessionStorage.getItem('booking:hearts') === '1');
  }, [location.search]);

  return (
    <>
      {showHearts && <HeartsOverlay />}
      <Outlet />
    </>
  );
}

const HEARTS = [
  { top: '8%', left: '12%', size: 28 },
  { top: '14%', left: '72%', size: 22 },
  { top: '26%', left: '32%', size: 26 },
  { top: '34%', left: '82%', size: 18 },
  { top: '48%', left: '10%', size: 24 },
  { top: '52%', left: '58%', size: 30 },
  { top: '66%', left: '28%', size: 20 },
  { top: '74%', left: '78%', size: 26 },
  { top: '86%', left: '48%', size: 22 },
  { top: '6%', left: '42%', size: 20 },
  { top: '10%', left: '90%', size: 18 },
  { top: '18%', left: '52%', size: 24 },
  { top: '22%', left: '6%', size: 20 },
  { top: '30%', left: '60%', size: 28 },
  { top: '38%', left: '22%', size: 22 },
  { top: '42%', left: '92%', size: 20 },
  { top: '56%', left: '38%', size: 26 },
  { top: '60%', left: '70%', size: 22 },
  { top: '68%', left: '8%', size: 18 },
  { top: '72%', left: '56%', size: 24 },
  { top: '80%', left: '18%', size: 20 },
  { top: '82%', left: '88%', size: 22 },
  { top: '90%', left: '30%', size: 24 },
  { top: '92%', left: '66%', size: 20 },
];

function HeartsOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {HEARTS.map((heart, index) => (
        <HeartIcon
          key={index}
          className="absolute fill-current stroke-current text-rose-400 drop-shadow"
          fill="currentColor"
          stroke="currentColor"
          style={{
            top: heart.top,
            left: heart.left,
            width: `${heart.size}px`,
            height: `${heart.size}px`,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

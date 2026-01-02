export function SimpleShinyBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.12]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="warm-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.62 0.14 35)" stopOpacity="1" />
            <stop offset="50%" stopColor="oklch(0.72 0.1 45)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="oklch(0.62 0.14 35)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="warm-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.68 0.08 150)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="oklch(0.72 0.1 45)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="oklch(0.62 0.14 35)" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M0,403.181C73.526,390.43,133.077,345.078,196.549,305.836C261.239,265.84,342.837,240.177,375.07,171.289C407.356,102.289,383.591,21.3,364.149,-52.357C346.428,-119.493,304.146,-173.057,268.456,-232.618C224.421,-306.106,209.058,-409.811,130.074,-442.992C51.469,-476.014,-32.719,-413.628,-115.688,-393.998C-204.213,-373.053,-310.434,-389.18,-373.69,-323.804C-437.204,-258.161,-433.475,-154.019,-436.225,-62.72C-438.734,20.567,-421.55,100.939,-388.794,177.556C-355.369,255.737,-319.395,339.88,-245.854,382.557C-173.254,424.688,-82.705,417.524,0,403.181"
          fill="url(#warm-gradient-1)"
          filter="url(#glow)"
        />
        <path
          d="M1440 1020.046C1532.263 1037.874 1629.274 1026.904 1714.169 986.616 1805.729 943.165 1884.163 873.848 1934.009 785.606 1986.451 692.768 2026.055 582.95 2000.695 479.384 1975.913 378.177 1877.091 318.557 1801.964 246.356 1733.819 180.865 1669.758 111.606 1581.861 76.865 1488.37 39.913 1385.589 18.046 1288.292 43.33 1189.599 68.977 1112.663 141.486 1043.796 216.688 973.357 293.606 892.012 376.397 887.846 480.612 883.746 583.196 957.247 671.386 1022.451 750.688 1076.11 815.949 1155.404 846.566 1226.401 892.366 1297.547 938.262 1356.873 1003.984 1440 1020.046"
          fill="url(#warm-gradient-2)"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
}

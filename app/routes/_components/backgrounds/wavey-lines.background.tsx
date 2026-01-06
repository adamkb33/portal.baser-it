export function WaveyLinesBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.12]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 560"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="1" />
            <stop offset="50%" stopColor="var(--color-sidebar-accent)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-sidebar-bg)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="var(--color-sidebar-accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.4" />
          </linearGradient>
          <filter id="wave-glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g fill="none">
          <path
            d="M -372.3044959775232,81 C -276.3,127.2 -84.3,278.2 107.69550402247681,312 C 299.7,345.8 395.7,232.6 587.6955040224768,250 C 779.7,267.4 875.7,409 1067.6955040224768,399 C 1259.7,389 1473.23,222.2 1547.6955040224768,200 C 1622.16,177.8 1461.54,270.4 1440,288"
            stroke="url(#wave-gradient-1)"
            strokeWidth="2"
            filter="url(#wave-glow)"
          />
          <path
            d="M -543.7249145074591,90 C -447.72,142 -255.72,324.4 -63.72491450745903,350 C 128.28,375.6 224.28,207 416.27508549254094,218 C 608.28,229 704.28,415.2 896.2750854925409,405 C 1088.28,394.8 1267.53,155.2 1376.275085492541,167 C 1485.02,178.8 1427.26,404.6 1440,464"
            stroke="url(#wave-gradient-2)"
            strokeWidth="2"
            filter="url(#wave-glow)"
          />
          <path
            d="M -726.2316309522428,501 C -630.23,455.4 -438.23,292 -246.2316309522428,273 C -54.23,254 41.77,443 233.7683690477572,406 C 425.77,369 521.77,92 713.7683690477572,88 C 905.77,84 1048.52,358.8 1193.7683690477572,386 C 1339.01,413.2 1390.75,256.4 1440,224"
            stroke="url(#wave-gradient-1)"
            strokeWidth="2"
            filter="url(#wave-glow)"
          />
          <path
            d="M -890.7436568830014,172 C -794.74,220.6 -602.74,427.4 -410.7436568830015,415 C -218.74,402.6 -122.74,93 69.2563431169985,110 C 261.26,127 357.26,481.4 549.2563431169986,500 C 741.26,518.6 851.11,218.8 1029.2563431169986,203 C 1207.41,187.2 1357.85,377.4 1440,421"
            stroke="url(#wave-gradient-2)"
            strokeWidth="2"
            filter="url(#wave-glow)"
          />
        </g>
      </svg>
    </div>
  );
}

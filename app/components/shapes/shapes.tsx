// Original
export function ShapesOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large circle - top right */}
      <circle cx="85%" cy="15%" r="140" fill="oklch(0.41 0.12 335)" opacity="0.12" />

      {/* Medium circle - bottom left */}
      <circle cx="15%" cy="85%" r="100" fill="oklch(0.41 0.12 335)" opacity="0.08" />

      {/* Small accent circles */}
      <circle cx="10%" cy="15%" r="30" fill="oklch(0.41 0.12 335)" opacity="0.15" />
      <circle cx="92%" cy="75%" r="50" fill="oklch(0.41 0.12 335)" opacity="0.1" />

      {/* Gradient blob - middle */}
      <ellipse cx="50%" cy="50%" rx="200" ry="250" fill="oklch(0.41 0.12 335)" opacity="0.05" />

      {/* Floating dots cluster */}
      <circle cx="75%" cy="25%" r="4" fill="oklch(0.41 0.12 335)" opacity="0.25" />
      <circle cx="78%" cy="28%" r="3" fill="oklch(0.41 0.12 335)" opacity="0.2" />
      <circle cx="72%" cy="28%" r="3" fill="oklch(0.41 0.12 335)" opacity="0.3" />

      {/* Abstract curves */}
      <path d="M 20 80 Q 30 60, 40 80" stroke="oklch(0.41 0.12 335)" strokeWidth="2" fill="none" opacity="0.12" />
    </svg>
  );
}

// Variation 1: Angular Blocks
export function ShapesAngularOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large rotated rectangles */}
      <rect
        x="70%"
        y="10%"
        width="280"
        height="280"
        fill="oklch(0.41 0.12 335)"
        opacity="0.1"
        transform="rotate(15 85 25)"
      />
      <rect
        x="5%"
        y="70%"
        width="200"
        height="200"
        fill="oklch(0.41 0.12 335)"
        opacity="0.12"
        transform="rotate(-20 15 80)"
      />

      {/* Medium squares */}
      <rect
        x="5%"
        y="10%"
        width="60"
        height="60"
        fill="oklch(0.41 0.12 335)"
        opacity="0.15"
        transform="rotate(45 8 13)"
      />
      <rect
        x="88%"
        y="75%"
        width="80"
        height="80"
        fill="oklch(0.41 0.12 335)"
        opacity="0.08"
        transform="rotate(30 92 79)"
      />

      {/* Horizontal bars */}
      <rect x="30%" y="45%" width="400" height="120" fill="oklch(0.41 0.12 335)" opacity="0.05" rx="10" />

      {/* Small squares cluster */}
      <rect
        x="75%"
        y="22%"
        width="8"
        height="8"
        fill="oklch(0.41 0.12 335)"
        opacity="0.25"
        transform="rotate(45 76 23)"
      />
      <rect
        x="78%"
        y="26%"
        width="6"
        height="6"
        fill="oklch(0.41 0.12 335)"
        opacity="0.2"
        transform="rotate(45 79 27)"
      />
      <rect
        x="72%"
        y="26%"
        width="6"
        height="6"
        fill="oklch(0.41 0.12 335)"
        opacity="0.3"
        transform="rotate(45 73 27)"
      />

      {/* Angular lines */}
      <path d="M 20 80 L 30 60 L 40 80" stroke="oklch(0.41 0.12 335)" strokeWidth="2" fill="none" opacity="0.12" />
    </svg>
  );
}

// Variation 2: Hexagon Grid
export function ShapesHexagonOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large hexagons */}
      <polygon
        points="85,5 95,12.5 95,27.5 85,35 75,27.5 75,12.5"
        fill="oklch(0.41 0.12 335)"
        opacity="0.12"
        transform="scale(2.5)"
      />
      <polygon
        points="15,70 25,77.5 25,92.5 15,100 5,92.5 5,77.5"
        fill="oklch(0.41 0.12 335)"
        opacity="0.1"
        transform="scale(2)"
      />

      {/* Medium hexagons */}
      <polygon
        points="10,10 15,13 15,19 10,22 5,19 5,13"
        fill="oklch(0.41 0.12 335)"
        opacity="0.15"
        transform="scale(1.5)"
      />
      <polygon
        points="90,70 95,73 95,79 90,82 85,79 85,73"
        fill="oklch(0.41 0.12 335)"
        opacity="0.08"
        transform="scale(1.8)"
      />

      {/* Center large hexagon */}
      <polygon
        points="50,35 60,41 60,53 50,59 40,53 40,41"
        fill="oklch(0.41 0.12 335)"
        opacity="0.05"
        transform="scale(3)"
      />

      {/* Small hexagon cluster */}
      <polygon points="75,23 77,24 77,27 75,28 73,27 73,24" fill="oklch(0.41 0.12 335)" opacity="0.25" />
      <polygon points="78,26 80,27 80,30 78,31 76,30 76,27" fill="oklch(0.41 0.12 335)" opacity="0.2" />
      <polygon points="72,26 74,27 74,30 72,31 70,30 70,27" fill="oklch(0.41 0.12 335)" opacity="0.3" />
    </svg>
  );
}

// Variation 3: Triangle Pattern
export function ShapesTriangleOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large triangles */}
      <polygon points="85,5 95,30 75,30" fill="oklch(0.41 0.12 335)" opacity="0.12" transform="scale(3)" />
      <polygon points="15,70 25,95 5,95" fill="oklch(0.41 0.12 335)" opacity="0.1" transform="scale(2.5)" />

      {/* Inverted triangles */}
      <polygon points="10,25 20,5 5,5" fill="oklch(0.41 0.12 335)" opacity="0.15" transform="scale(2)" />
      <polygon points="90,85 95,75 85,75" fill="oklch(0.41 0.12 335)" opacity="0.08" transform="scale(2.2)" />

      {/* Center triangle */}
      <polygon points="50,40 60,60 40,60" fill="oklch(0.41 0.12 335)" opacity="0.05" transform="scale(3)" />

      {/* Small triangle cluster */}
      <polygon points="75,23 77,27 73,27" fill="oklch(0.41 0.12 335)" opacity="0.25" />
      <polygon points="78,27 80,31 76,31" fill="oklch(0.41 0.12 335)" opacity="0.2" />
      <polygon points="72,27 74,31 70,31" fill="oklch(0.41 0.12 335)" opacity="0.3" />

      {/* Angular paths */}
      <path d="M 20 80 L 30 60 L 40 80 Z" stroke="oklch(0.41 0.12 335)" strokeWidth="2" fill="none" opacity="0.12" />
    </svg>
  );
}

// Variation 4: Industrial Grid
export function ShapesIndustrialOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large rectangles - horizontal and vertical */}
      <rect x="60%" y="15%" width="300" height="80" fill="oklch(0.41 0.12 335)" opacity="0.1" />
      <rect x="10%" y="60%" width="80" height="250" fill="oklch(0.41 0.12 335)" opacity="0.12" />

      {/* Medium squares - grid pattern */}
      <rect x="8%" y="12%" width="60" height="60" fill="oklch(0.41 0.12 335)" opacity="0.15" />
      <rect x="85%" y="75%" width="70" height="70" fill="oklch(0.41 0.12 335)" opacity="0.08" />

      {/* Thin lines - structural */}
      <rect x="45%" y="10%" width="4" height="500" fill="oklch(0.41 0.12 335)" opacity="0.06" />
      <rect x="10%" y="45%" width="500" height="4" fill="oklch(0.41 0.12 335)" opacity="0.06" />

      {/* Small squares cluster */}
      <rect x="74%" y="22%" width="8" height="8" fill="oklch(0.41 0.12 335)" opacity="0.25" />
      <rect x="77%" y="26%" width="6" height="6" fill="oklch(0.41 0.12 335)" opacity="0.2" />
      <rect x="71%" y="26%" width="6" height="6" fill="oklch(0.41 0.12 335)" opacity="0.3" />

      {/* Corner brackets */}
      <path d="M 20 20 L 25 20 L 25 25" stroke="oklch(0.41 0.12 335)" strokeWidth="3" fill="none" opacity="0.12" />
      <path d="M 80 80 L 85 80 L 85 85" stroke="oklch(0.41 0.12 335)" strokeWidth="3" fill="none" opacity="0.12" />
    </svg>
  );
}

// Variation 5: Diamond Pattern
export function ShapesDiamondOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large diamonds */}
      <rect
        x="75%"
        y="10%"
        width="200"
        height="200"
        fill="oklch(0.41 0.12 335)"
        opacity="0.1"
        transform="rotate(45 85 20)"
      />
      <rect
        x="10%"
        y="75%"
        width="150"
        height="150"
        fill="oklch(0.41 0.12 335)"
        opacity="0.12"
        transform="rotate(45 17.5 82.5)"
      />

      {/* Medium diamonds */}
      <rect
        x="8%"
        y="12%"
        width="50"
        height="50"
        fill="oklch(0.41 0.12 335)"
        opacity="0.15"
        transform="rotate(45 10.5 14.5)"
      />
      <rect
        x="88%"
        y="72%"
        width="60"
        height="60"
        fill="oklch(0.41 0.12 335)"
        opacity="0.08"
        transform="rotate(45 91 75)"
      />

      {/* Center diamond */}
      <rect
        x="35%"
        y="35%"
        width="300"
        height="300"
        fill="oklch(0.41 0.12 335)"
        opacity="0.05"
        transform="rotate(45 50 50)"
      />

      {/* Small diamond cluster */}
      <rect
        x="74%"
        y="22%"
        width="6"
        height="6"
        fill="oklch(0.41 0.12 335)"
        opacity="0.25"
        transform="rotate(45 75 23)"
      />
      <rect
        x="77%"
        y="26%"
        width="5"
        height="5"
        fill="oklch(0.41 0.12 335)"
        opacity="0.2"
        transform="rotate(45 78 27)"
      />
      <rect
        x="71%"
        y="26%"
        width="5"
        height="5"
        fill="oklch(0.41 0.12 335)"
        opacity="0.3"
        transform="rotate(45 72 27)"
      />

      {/* Angular cross lines */}
      <path d="M 30 50 L 70 50 M 50 30 L 50 70" stroke="oklch(0.41 0.12 335)" strokeWidth="2" opacity="0.08" />
    </svg>
  );
}

// Variation 6: Tech Blocks
export function ShapesTechOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large tech blocks */}
      <rect x="65%" y="10%" width="250" height="150" fill="oklch(0.41 0.12 335)" opacity="0.1" rx="8" />
      <rect x="10%" y="70%" width="180" height="200" fill="oklch(0.41 0.12 335)" opacity="0.12" rx="8" />

      {/* Circuit-like rectangles */}
      <rect x="15%" y="15%" width="40" height="80" fill="oklch(0.41 0.12 335)" opacity="0.15" />
      <rect x="20%" y="20%" width="80" height="40" fill="oklch(0.41 0.12 335)" opacity="0.12" />

      <rect x="80%" y="75%" width="50" height="90" fill="oklch(0.41 0.12 335)" opacity="0.08" />
      <rect x="75%" y="80%" width="90" height="35" fill="oklch(0.41 0.12 335)" opacity="0.1" />

      {/* Center wide bar */}
      <rect x="25%" y="47%" width="500" height="60" fill="oklch(0.41 0.12 335)" opacity="0.05" rx="30" />

      {/* Connecting lines */}
      <path d="M 30 30 L 70 50" stroke="oklch(0.41 0.12 335)" strokeWidth="2" opacity="0.1" />
      <path d="M 70 50 L 85 75" stroke="oklch(0.41 0.12 335)" strokeWidth="2" opacity="0.1" />

      {/* Small tech elements */}
      <rect x="74%" y="22%" width="8" height="8" fill="oklch(0.41 0.12 335)" opacity="0.25" />
      <rect x="77%" y="26%" width="6" height="6" fill="oklch(0.41 0.12 335)" opacity="0.2" />
      <rect x="71%" y="26%" width="6" height="6" fill="oklch(0.41 0.12 335)" opacity="0.3" />
    </svg>
  );
}

// Variation 7: Chevron Pattern
export function ShapesChevronOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large chevrons */}
      <path
        d="M 70 10 L 85 25 L 70 40"
        stroke="oklch(0.41 0.12 335)"
        strokeWidth="25"
        fill="none"
        opacity="0.12"
        strokeLinecap="square"
      />
      <path
        d="M 10 70 L 25 85 L 10 100"
        stroke="oklch(0.41 0.12 335)"
        strokeWidth="20"
        fill="none"
        opacity="0.1"
        strokeLinecap="square"
      />

      {/* Medium chevrons */}
      <path
        d="M 5 10 L 15 20 L 5 30"
        stroke="oklch(0.41 0.12 335)"
        strokeWidth="12"
        fill="none"
        opacity="0.15"
        strokeLinecap="square"
      />
      <path
        d="M 85 65 L 95 75 L 85 85"
        stroke="oklch(0.41 0.12 335)"
        strokeWidth="15"
        fill="none"
        opacity="0.08"
        strokeLinecap="square"
      />

      {/* Center chevron pattern */}
      <path
        d="M 35 45 L 50 50 L 35 55"
        stroke="oklch(0.41 0.12 335)"
        strokeWidth="30"
        fill="none"
        opacity="0.05"
        strokeLinecap="square"
      />
      <path
        d="M 50 45 L 65 50 L 50 55"
        stroke="oklch(0.41 0.12 335)"
        strokeWidth="30"
        fill="none"
        opacity="0.05"
        strokeLinecap="square"
      />

      {/* Small chevrons cluster */}
      <path d="M 73 22 L 76 25 L 73 28" stroke="oklch(0.41 0.12 335)" strokeWidth="2" fill="none" opacity="0.25" />
      <path d="M 76 26 L 79 29 L 76 32" stroke="oklch(0.41 0.12 335)" strokeWidth="2" fill="none" opacity="0.2" />
      <path d="M 70 26 L 73 29 L 70 32" stroke="oklch(0.41 0.12 335)" strokeWidth="2" fill="none" opacity="0.3" />

      {/* Angular brackets */}
      <path d="M 20 75 L 25 80 L 20 85" stroke="oklch(0.41 0.12 335)" strokeWidth="3" fill="none" opacity="0.12" />
    </svg>
  );
}

// Variation 8: Striped Angular
export function ShapesStripedOne() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Large rotated striped blocks */}
      <g transform="rotate(15 85 25)">
        <rect x="70%" y="5%" width="280" height="40" fill="oklch(0.41 0.12 335)" opacity="0.12" />
        <rect x="70%" y="10%" width="280" height="40" fill="oklch(0.41 0.12 335)" opacity="0.08" />
        <rect x="70%" y="15%" width="280" height="40" fill="oklch(0.41 0.12 335)" opacity="0.1" />
      </g>

      <g transform="rotate(-20 15 80)">
        <rect x="5%" y="70%" width="200" height="30" fill="oklch(0.41 0.12 335)" opacity="0.1" />
        <rect x="5%" y="75%" width="200" height="30" fill="oklch(0.41 0.12 335)" opacity="0.12" />
      </g>

      {/* Diagonal bars */}
      <rect
        x="40%"
        y="35%"
        width="400"
        height="15"
        fill="oklch(0.41 0.12 335)"
        opacity="0.06"
        transform="rotate(25 50 50)"
      />
      <rect
        x="40%"
        y="45%"
        width="400"
        height="15"
        fill="oklch(0.41 0.12 335)"
        opacity="0.05"
        transform="rotate(25 50 50)"
      />
      <rect
        x="40%"
        y="55%"
        width="400"
        height="15"
        fill="oklch(0.41 0.12 335)"
        opacity="0.04"
        transform="rotate(25 50 50)"
      />

      {/* Corner squares */}
      <rect
        x="8%"
        y="12%"
        width="50"
        height="50"
        fill="oklch(0.41 0.12 335)"
        opacity="0.15"
        transform="rotate(45 10.5 14.5)"
      />
      <rect
        x="88%"
        y="72%"
        width="60"
        height="60"
        fill="oklch(0.41 0.12 335)"
        opacity="0.08"
        transform="rotate(30 91 75)"
      />

      {/* Small squares */}
      <rect x="74%" y="22%" width="8" height="8" fill="oklch(0.41 0.12 335)" opacity="0.25" />
      <rect x="77%" y="26%" width="6" height="6" fill="oklch(0.41 0.12 335)" opacity="0.2" />
      <rect x="71%" y="26%" width="6" height="6" fill="oklch(0.41 0.12 335)" opacity="0.3" />
    </svg>
  );
}

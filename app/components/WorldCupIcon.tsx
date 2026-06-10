export function WorldCupIcon({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wc-gold" x1="32" y1="8" x2="32" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5D565" />
          <stop offset="0.45" stopColor="#E8B923" />
          <stop offset="1" stopColor="#C98A10" />
        </linearGradient>
        <linearGradient id="wc-gold-dark" x1="20" y1="18" x2="44" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A017" />
          <stop offset="1" stopColor="#9A6B08" />
        </linearGradient>
        <linearGradient id="wc-globe" x1="24" y1="10" x2="40" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4C7" />
          <stop offset="1" stopColor="#E8B923" />
        </linearGradient>
        <filter id="wc-shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0B2840" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter="url(#wc-shadow)">
        {/* Base */}
        <path
          d="M14 58h36l-2.5 10H16.5L14 58Z"
          fill="#0B2840"
        />
        <path
          d="M16 54h32l2 4H14l2-4Z"
          fill="url(#wc-gold-dark)"
        />
        <rect x="15" y="50" width="34" height="4" rx="1" fill="#008A97" />
        <rect x="15" y="46" width="34" height="3" rx="1" fill="#50B7C4" />

        {/* Left arm */}
        <path
          d="M30 24C18 30 12 40 14 50h8c1-8 6-14 14-18l4-8Z"
          fill="url(#wc-gold)"
        />
        {/* Right arm */}
        <path
          d="M34 24c12 6 18 16 16 26h-8c-1-8-6-14-14-18l-4-8Z"
          fill="url(#wc-gold-dark)"
        />

        {/* Globe */}
        <circle cx="32" cy="18" r="11" fill="url(#wc-globe)" />
        <path
          d="M24 18c0-2 1.8-4 4-4 2.2 0 4 1.8 4 4s-1.8 4-4 4c-2.2 0-4-1.8-4-4Z"
          fill="#C98A10"
          opacity="0.35"
        />
        <path
          d="M32 11c4.4 0 8 3.1 8 7"
          stroke="#B8860B"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M21 18h22M32 7v22"
          stroke="#B8860B"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Stem */}
        <path d="M28 29h8v4h-8v-4Z" fill="#C98A10" />
      </g>

      {/* 2026 badge */}
      <rect x="20" y="66" width="24" height="10" rx="5" fill="#008A97" />
      <text
        x="32"
        y="73.5"
        textAnchor="middle"
        fill="white"
        fontSize="6.5"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        2026
      </text>
    </svg>
  );
}

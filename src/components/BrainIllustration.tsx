export function BrainIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Brain outline */}
      <path
        d="M100 20C60 20 30 50 30 90C30 110 40 125 55 135C50 145 50 160 60 170C70 180 85 180 95 175C100 185 110 190 120 185C135 178 145 165 145 150C155 155 170 150 175 140C180 130 175 115 165 110C170 100 170 85 160 75C155 60 140 50 125 48C120 35 110 25 100 20Z"
        stroke="url(#brainGradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      
      {/* Brain folds - left hemisphere */}
      <path
        d="M70 60C80 65 85 80 80 95"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M55 80C65 85 75 95 70 110"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M65 100C75 105 80 115 75 130"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M85 50C95 55 100 70 95 85"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      
      {/* Brain folds - right hemisphere */}
      <path
        d="M130 60C120 65 115 80 120 95"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M145 80C135 85 125 95 130 110"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M135 100C125 105 120 115 125 130"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M115 50C105 55 100 70 105 85"
        stroke="url(#brainGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      
      {/* Neural network nodes */}
      <circle cx="75" cy="70" r="4" fill="url(#nodeGradient)" opacity="0.8" />
      <circle cx="125" cy="70" r="4" fill="url(#nodeGradient)" opacity="0.8" />
      <circle cx="60" cy="95" r="3" fill="url(#nodeGradient)" opacity="0.7" />
      <circle cx="140" cy="95" r="3" fill="url(#nodeGradient)" opacity="0.7" />
      <circle cx="80" cy="120" r="3.5" fill="url(#nodeGradient)" opacity="0.75" />
      <circle cx="120" cy="120" r="3.5" fill="url(#nodeGradient)" opacity="0.75" />
      <circle cx="100" cy="100" r="5" fill="url(#nodeGradient)" opacity="0.9" />
      
      {/* Neural connections */}
      <line x1="75" y1="70" x2="100" y2="100" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.5" />
      <line x1="125" y1="70" x2="100" y2="100" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.5" />
      <line x1="60" y1="95" x2="80" y2="120" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4" />
      <line x1="140" y1="95" x2="120" y2="120" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4" />
      <line x1="80" y1="120" x2="120" y2="120" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4" />
      
      {/* Glow effect */}
      <circle cx="100" cy="100" r="40" fill="url(#glowGradient)" opacity="0.15" />
      
      <defs>
        <linearGradient id="brainGradient" x1="30" y1="20" x2="180" y2="180">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA500" />
        </radialGradient>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFA500" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

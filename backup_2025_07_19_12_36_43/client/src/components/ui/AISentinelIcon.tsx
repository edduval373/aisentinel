interface AISentinelIconProps {
  className?: string;
}

export const AISentinelIcon = ({ className = "w-10 h-10" }: AISentinelIconProps) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#87CEEB" />
        <stop offset="50%" stopColor="#4682B4" />
        <stop offset="100%" stopColor="#2F4F4F" />
      </linearGradient>
    </defs>
    
    {/* Atomic structure rings representing AI intelligence */}
    <g transform="translate(50,50)">
      {/* Outer ring */}
      <ellipse 
        cx="0" cy="0" 
        rx="35" ry="12" 
        fill="none" 
        stroke="url(#aiGradient)" 
        strokeWidth="3"
        transform="rotate(0)"
      />
      
      {/* Middle ring */}
      <ellipse 
        cx="0" cy="0" 
        rx="35" ry="12" 
        fill="none" 
        stroke="url(#aiGradient)" 
        strokeWidth="3"
        transform="rotate(60)"
      />
      
      {/* Inner ring */}
      <ellipse 
        cx="0" cy="0" 
        rx="35" ry="12" 
        fill="none" 
        stroke="url(#aiGradient)" 
        strokeWidth="3"
        transform="rotate(120)"
      />
      
      {/* Center core */}
      <circle 
        cx="0" cy="0" 
        r="6" 
        fill="url(#aiGradient)"
      />
      
      {/* Orbital elements */}
      <circle cx="25" cy="0" r="2" fill="#4682B4" transform="rotate(0)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0;360"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>
      
      <circle cx="25" cy="0" r="2" fill="#4682B4" transform="rotate(120)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="120;480"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>
      
      <circle cx="25" cy="0" r="2" fill="#4682B4" transform="rotate(240)">
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="240;600"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  </svg>
);
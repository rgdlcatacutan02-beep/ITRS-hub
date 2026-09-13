import React from 'react';

interface ITRSHubLogoProps {
  className?: string;
  size?: number | string;
  customLogo?: string;
  withGlow?: boolean;
}

const ITRSHubLogo: React.FC<ITRSHubLogoProps> = ({ 
  className = "w-8 h-8", 
  customLogo,
  withGlow = true
}) => {
  if (customLogo) {
    return <img src={customLogo} alt="ITRS Hub Logo" className={`${className} object-contain`} />;
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {withGlow && (
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-cyan-500/30 rounded-full blur-md opacity-70 pointer-events-none" />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-sm"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="itrsTopFace" x1="50" y1="12" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          
          <linearGradient id="itrsLeftFace" x1="16" y1="32" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          
          <linearGradient id="itrsRightFace" x1="84" y1="32" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>

          <linearGradient id="itrsCoreGlow" x1="35" y1="35" x2="65" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          <filter id="coreShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* 3D Isometric Hex-Cube Base */}
        {/* Top Diamond Face */}
        <polygon 
          points="50,14 84,33 50,52 16,33" 
          fill="url(#itrsTopFace)"
          stroke="#4338ca"
          strokeWidth="1.5"
        />

        {/* Left Face */}
        <polygon 
          points="16,33 50,52 50,88 16,69" 
          fill="url(#itrsLeftFace)"
          stroke="#0369a1"
          strokeWidth="1.5"
        />

        {/* Right Face */}
        <polygon 
          points="50,52 84,33 84,69 50,88" 
          fill="url(#itrsRightFace)"
          stroke="#9d174d"
          strokeWidth="1.5"
        />

        {/* Inner Isometric Wireframe Accent lines */}
        <line x1="50" y1="14" x2="50" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="16" y1="33" x2="50" y2="52" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="84" y1="33" x2="50" y2="52" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="50" y1="52" x2="50" y2="88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Central IT Nexus Sphere / Node */}
        <circle 
          cx="50" 
          cy="52" 
          r="10" 
          fill="url(#itrsCoreGlow)" 
          filter="url(#coreShadow)"
        />

        {/* Internal Cross Network Lines on Core */}
        <circle cx="50" cy="52" r="5" fill="#4f46e5" />
        <circle cx="50" cy="52" r="2" fill="#ffffff" />

        {/* Corner Micro Tech Nodes */}
        <circle cx="50" cy="14" r="2.5" fill="#e0e7ff" />
        <circle cx="84" cy="33" r="2.5" fill="#fce7f3" />
        <circle cx="16" cy="33" r="2.5" fill="#e0f2fe" />
        <circle cx="50" cy="88" r="2.5" fill="#ffffff" />
      </svg>
    </div>
  );
};

export default ITRSHubLogo;

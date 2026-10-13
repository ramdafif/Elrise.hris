import React from 'react';

interface ElriseLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'symbol' | 'compact';
  theme?: 'light' | 'dark'; // light: for white/light bg, dark: for navy bg
}

/**
 * ELRISE Brand Logo & Symbol
 * Brand Identity Palette:
 * - Primary Navy: #123456
 * - Brand Teal: #2FA493
 * - Background Off-White: #F3F4EF
 */
export const ElriseSymbol: React.FC<{ size?: number; className?: string; inverted?: boolean }> = ({
  size = 32,
  className = '',
  inverted = false,
}) => {
  const navyColor = inverted ? '#FFFFFF' : '#123456';
  const tealColor = '#2FA493';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ELRISE Brand Symbol"
    >
      <defs>
        <linearGradient id="elriseTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BBA7" />
          <stop offset="100%" stopColor="#258577" />
        </linearGradient>
        <linearGradient id="elriseNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={inverted ? '#FFFFFF' : '#163D66'} />
          <stop offset="100%" stopColor={inverted ? '#DFE7E8' : '#0D2742'} />
        </linearGradient>
      </defs>
      {/* Background soft squircle badge for high visibility */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill={inverted ? 'rgba(255,255,255,0.08)' : '#E6F5F1'}
        stroke={inverted ? 'rgba(255,255,255,0.15)' : '#DFE7E8'}
        strokeWidth="1"
      />
      {/* Geometric 'E' & Rising Monogram */}
      {/* Left pillar / Foundation (Navy) */}
      <path
        d="M12 14C12 12.8954 12.8954 12 14 12H20C21.1046 12 22 12.8954 22 14V34C22 35.1046 21.1046 36 20 36H14C12.8954 36 12 35.1046 12 34V14Z"
        fill="url(#elriseNavyGrad)"
      />
      {/* Top Wing / Ascending Tier (Teal) */}
      <path
        d="M24 14C24 12.8954 24.8954 12 26 12H34C35.1046 12 36 12.8954 36 14C36 15.1046 35.1046 16 34 16H26C24.8954 16 24 15.1046 24 14Z"
        fill="url(#elriseTealGrad)"
      />
      {/* Center Dynamic Bar (Navy) */}
      <path
        d="M24 24C24 22.8954 24.8954 22 26 22H31C32.1046 22 33 22.8954 33 24C33 25.1046 32.1046 26 31 26H26C24.8954 26 24 25.1046 24 24Z"
        fill={navyColor}
      />
      {/* Rising Arrowhead / Growth Fin (Teal) */}
      <path
        d="M24 34C24 32.8954 24.8954 32 26 32H36C37.1046 32 38 32.8954 38 34C38 35.1046 37.1046 36 36 36H26C24.8954 36 24 35.1046 24 34Z"
        fill="url(#elriseTealGrad)"
      />
      {/* Upward accent dot representing Rise / Momentum */}
      <circle cx="36" cy="24" r="2.5" fill="#2FA493" />
    </svg>
  );
};

export const ElriseLogo: React.FC<ElriseLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const sizeMap = {
    sm: { symbolSize: 28, textClass: 'text-sm', badgeClass: 'text-[9px] px-1 py-0.5' },
    md: { symbolSize: 36, textClass: 'text-base', badgeClass: 'text-[10px] px-1.5 py-0.5' },
    lg: { symbolSize: 44, textClass: 'text-xl', badgeClass: 'text-xs px-2 py-0.5' },
  };

  const { symbolSize, textClass, badgeClass } = sizeMap[size];

  if (variant === 'symbol') {
    return <ElriseSymbol size={symbolSize} className={className} inverted={isDark} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <ElriseSymbol size={symbolSize} inverted={isDark} />
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-tight ${textClass} ${
              isDark ? 'text-white' : 'text-[#123456]'
            }`}
            style={{ letterSpacing: '-0.03em' }}
          >
            EL<span className="text-[#2FA493]">RISE</span>
          </span>
          <span
            className={`font-bold uppercase tracking-wider rounded border ${badgeClass} ${
              isDark
                ? 'bg-white/10 text-[#2FA493] border-white/20'
                : 'bg-[#E6F5F1] text-[#197568] border-[#DFE7E8]'
            }`}
          >
            HRIS
          </span>
        </div>
        {variant === 'full' && (
          <span
            className={`mt-0.5 text-[9px] font-semibold tracking-wider uppercase ${
              isDark ? 'text-slate-300' : 'text-[#64748B]'
            }`}
          >
            Enterprise Human Resources
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';

interface ManaCostProps {
  manaCost?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ManaCost: React.FC<ManaCostProps> = ({
  manaCost,
  size = 'md',
  className = ''
}) => {
  if (!manaCost) return null;

  // Extract all tokens enclosed in brackets, e.g. {3}, {B}, {B}, {X}, {W/U}
  const matches = manaCost.match(/\{([^}]+)\}/g);
  if (!matches || matches.length === 0) return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[10px]',
    lg: 'w-6 h-6 text-xs'
  }[size];

  const svgSize = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {matches.map((tokenWithBraces, idx) => {
        const symbol = tokenWithBraces.replace(/[{}]/g, '').trim().toUpperCase();

        // 1. White (W)
        if (symbol === 'W') {
          return (
            <span
              key={idx}
              title="White Mana"
              className={`${sizeClasses} rounded-full bg-[#fdfbe2] text-[#4a4216] border border-[#d6cf94] flex items-center justify-center font-black shadow-sm flex-shrink-0`}
            >
              <svg viewBox="0 0 100 100" className={`${svgSize} fill-current`}>
                <circle cx="50" cy="50" r="22" />
                <path d="M50 10 L55 24 L45 24 Z M50 90 L55 76 L45 76 Z M10 50 L24 55 L24 45 Z M90 50 L76 55 L76 45 Z M22 22 L35 30 L28 37 Z M78 78 L65 70 L72 63 Z M78 22 L70 35 L63 28 Z M22 78 L30 65 L37 72 Z" />
              </svg>
            </span>
          );
        }

        // 2. Blue (U)
        if (symbol === 'U') {
          return (
            <span
              key={idx}
              title="Blue Mana"
              className={`${sizeClasses} rounded-full bg-[#0d73b8] text-white border border-[#38bdf8] flex items-center justify-center font-black shadow-sm flex-shrink-0`}
            >
              <svg viewBox="0 0 100 100" className={`${svgSize} fill-current`}>
                <path d="M50 15 C45 28, 25 55, 25 68 C25 82, 36 90, 50 90 C64 90, 75 82, 75 68 C75 55, 55 28, 50 15 Z" />
              </svg>
            </span>
          );
        }

        // 3. Black (B)
        if (symbol === 'B') {
          return (
            <span
              key={idx}
              title="Black Mana"
              className={`${sizeClasses} rounded-full bg-[#1b1924] text-[#cbd5e1] border border-[#64748b] flex items-center justify-center font-black shadow-sm flex-shrink-0`}
            >
              <svg viewBox="0 0 100 100" className={`${svgSize} fill-current`}>
                <path d="M30 40 C30 20, 70 20, 70 40 C70 52, 65 60, 62 65 L62 78 L38 78 L38 65 C35 60, 30 52, 30 40 Z" />
                <circle cx="42" cy="42" r="5" fill="#1b1924" />
                <circle cx="58" cy="42" r="5" fill="#1b1924" />
                <path d="M47 55 L53 55 L50 50 Z" fill="#1b1924" />
              </svg>
            </span>
          );
        }

        // 4. Red (R)
        if (symbol === 'R') {
          return (
            <span
              key={idx}
              title="Red Mana"
              className={`${sizeClasses} rounded-full bg-[#d63428] text-white border border-[#f87171] flex items-center justify-center font-black shadow-sm flex-shrink-0`}
            >
              <svg viewBox="0 0 100 100" className={`${svgSize} fill-current`}>
                <path d="M50 15 C52 30, 65 38, 65 52 C65 62, 58 68, 55 72 C62 68, 72 58, 72 45 C75 60, 70 82, 50 88 C30 82, 25 60, 28 45 C28 58, 38 68, 45 72 C42 68, 35 62, 35 52 C35 38, 48 30, 50 15 Z" />
              </svg>
            </span>
          );
        }

        // 5. Green (G)
        if (symbol === 'G') {
          return (
            <span
              key={idx}
              title="Green Mana"
              className={`${sizeClasses} rounded-full bg-[#1b803e] text-white border border-[#4ade80] flex items-center justify-center font-black shadow-sm flex-shrink-0`}
            >
              <svg viewBox="0 0 100 100" className={`${svgSize} fill-current`}>
                <path d="M50 15 L68 40 L58 40 L75 65 L55 65 L55 85 L45 85 L45 65 L25 65 L42 40 L32 40 Z" />
              </svg>
            </span>
          );
        }

        // 6. Colorless (C)
        if (symbol === 'C') {
          return (
            <span
              key={idx}
              title="Colorless Mana"
              className={`${sizeClasses} rounded-full bg-[#94a3b8] text-slate-900 border border-[#cbd5e1] flex items-center justify-center font-black shadow-sm flex-shrink-0`}
            >
              <svg viewBox="0 0 100 100" className={`${svgSize} fill-current`}>
                <path d="M50 15 L80 50 L50 85 L20 50 Z" />
              </svg>
            </span>
          );
        }

        // 7. Generic Numbers or X
        return (
          <span
            key={idx}
            title={`${symbol} Generic Mana`}
            className={`${sizeClasses} rounded-full bg-[#525968] text-slate-100 border border-[#788296] flex items-center justify-center font-extrabold shadow-sm flex-shrink-0 font-sans leading-none`}
          >
            {symbol}
          </span>
        );
      })}
    </span>
  );
};

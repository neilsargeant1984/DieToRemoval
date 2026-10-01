import React from 'react';
import { ManaCost } from './ManaCost';

interface FormattedOracleTextProps {
  text?: string;
  className?: string;
}

/**
 * Formats MTG card oracle/rules text into beautifully styled, high-contrast paragraphs
 * with inline SVG mana symbols and Planeswalker loyalty badges.
 */
export const FormattedOracleText: React.FC<FormattedOracleTextProps> = ({
  text,
  className = ''
}) => {
  if (!text || !text.trim()) {
    return <p className="italic text-stone-500 text-xs">No rules text.</p>;
  }

  const renderInlineTokens = (line: string) => {
    // Regex splits by mana symbols like {W}, {U}, {2}, {T}, etc.
    const parts = line.split(/(\{[^}]+\})/g);

    return parts.map((part, idx) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return (
          <ManaCost
            key={idx}
            manaCost={part}
            size="sm"
            className="mx-0.5 inline-flex align-middle"
          />
        );
      }

      // Check for reminder text enclosed in parentheses: (like this)
      if (part.includes('(') && part.includes(')')) {
        const subParts = part.split(/(\([^)]+\))/g);
        return (
          <span key={idx}>
            {subParts.map((sub, sIdx) => {
              if (sub.startsWith('(') && sub.endsWith(')')) {
                return (
                  <span key={sIdx} className="text-stone-400 italic text-[0.9em]">
                    {sub}
                  </span>
                );
              }
              return <span key={sIdx}>{sub}</span>;
            })}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  const lines = text.split('\n').filter(l => l.trim().length > 0);

  return (
    <div className={`space-y-2 text-stone-200 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Divider line (e.g., dual face "//")
        if (trimmed.startsWith('//')) {
          return (
            <div
              key={lineIdx}
              className="my-2 border-t border-amber-500/30 pt-1 text-[10px] uppercase font-bold text-amber-400/80 tracking-wider flex items-center gap-1.5"
            >
              <span>✦</span>
              <span>{trimmed.replace(/^\/\/\s*/, '')}</span>
            </div>
          );
        }

        // 2. Planeswalker Loyalty Cost Ability (e.g., "+1:", "-3:", "−2:", "0:")
        const loyaltyMatch = trimmed.match(/^([+−\-]?\d+|0):\s*(.*)$/);
        if (loyaltyMatch) {
          const cost = loyaltyMatch[1];
          const abilityText = loyaltyMatch[2];
          const isPlus = cost.startsWith('+');
          const isMinus = cost.startsWith('-') || cost.startsWith('−');

          return (
            <div key={lineIdx} className="flex items-start gap-2 leading-relaxed">
              <span
                className={`inline-flex items-center justify-center font-mono font-black text-[11px] min-w-[2.2rem] px-1.5 py-0.5 rounded-md shadow flex-shrink-0 mt-0.5 border ${
                  isPlus
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-amber-500/10'
                    : isMinus
                    ? 'bg-rose-950/90 text-rose-300 border-rose-600/60 shadow-rose-600/10'
                    : 'bg-stone-800 text-stone-200 border-stone-600'
                }`}
              >
                {cost}:
              </span>
              <div className="flex-1 text-stone-200">
                {renderInlineTokens(abilityText)}
              </div>
            </div>
          );
        }

        // 3. Regular rules text paragraph
        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderInlineTokens(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

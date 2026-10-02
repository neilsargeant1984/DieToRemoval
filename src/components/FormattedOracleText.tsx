import React from 'react';
import { ManaCost } from './ManaCost';
import { Sparkles, Shield } from 'lucide-react';

interface FormattedOracleTextProps {
  text?: string;
  className?: string;
}

const MTG_EVERGREEN_KEYWORDS = new Set([
  'deathtouch', 'defender', 'double strike', 'first strike',
  'flash', 'flying', 'haste', 'hexproof', 'indestructible',
  'lifelink', 'menace', 'reach', 'trample', 'vigilance',
  'ward', 'partner'
]);

/**
 * Formats MTG card oracle/rules text into beautifully styled, high-contrast paragraphs
 * with inline SVG mana symbols, authentic Planeswalker loyalty shields, and keyword badges.
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
    <div className={`space-y-2.5 text-stone-200 ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Divider line (e.g., dual face "//")
        if (trimmed.startsWith('//')) {
          return (
            <div
              key={lineIdx}
              className="my-3 border-t border-amber-500/30 pt-2 text-xs uppercase font-fantasy font-black text-amber-300 tracking-wider flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{trimmed.replace(/^\/\/\s*/, '')}</span>
            </div>
          );
        }

        // 2. Face Header (e.g. "Liliana, Defiant Necromancer:" when raw text concatenates faces)
        if (trimmed.match(/^[A-Z][a-zA-Z\s,']+:$/) && !trimmed.match(/^([+−\-–—]?\w+|0):/)) {
          return (
            <div
              key={lineIdx}
              className="mt-4 mb-2 pt-2.5 border-t border-amber-500/30 flex items-center gap-2 text-xs font-fantasy font-black tracking-wider uppercase text-amber-300"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{trimmed.replace(/:$/, '')}</span>
            </div>
          );
        }

        // 3. Planeswalker Loyalty Cost Ability (e.g., "+1:", "+2:", "-X:", "−X:", "−8:", "[+2]:", "0:")
        const loyaltyMatch = trimmed.match(/^(?:\[)?([+−\-–—]?(?:\d+|x|X)|0)(?:\])?:\s*(.*)$/i);
        if (loyaltyMatch) {
          const rawCost = loyaltyMatch[1];
          const abilityText = loyaltyMatch[2];
          const isPlus = rawCost.startsWith('+');
          const isMinus = rawCost.startsWith('-') || rawCost.startsWith('−') || rawCost.startsWith('–') || rawCost.startsWith('—');
          const displayCost = rawCost.replace(/^[-–—]/, '−').toUpperCase();

          return (
            <div
              key={lineIdx}
              className="flex items-start gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/20 transition leading-relaxed"
            >
              <span
                className={`inline-flex items-center justify-center font-mono font-black text-xs min-w-[2.8rem] px-2 py-1 rounded-lg shadow-md flex-shrink-0 mt-0.5 border select-none ${
                  isPlus
                    ? 'bg-gradient-to-b from-amber-500/30 via-amber-950/80 to-amber-950/95 text-amber-300 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : isMinus
                    ? 'bg-gradient-to-b from-rose-950/80 via-red-950/90 to-red-900/40 text-rose-300 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : 'bg-stone-800 text-stone-200 border-stone-600 shadow-sm'
                }`}
                title={isPlus ? `Planeswalker Loyalty +${displayCost.replace('+', '')}` : isMinus ? `Planeswalker Loyalty ${displayCost}` : 'Planeswalker Loyalty 0'}
              >
                {isPlus ? `▲ ${displayCost}` : isMinus ? `▼ ${displayCost}` : `◆ 0`}
              </span>
              <div className="flex-1 text-xs sm:text-sm text-stone-200 pt-0.5">
                {renderInlineTokens(abilityText)}
              </div>
            </div>
          );
        }

        // 4. Keyword only line (e.g. "Lifelink", "Flying, vigilance", "Deathtouch, lifelink")
        const keywordCandidates = trimmed.split(/,\s*/).map(k => k.trim().toLowerCase());
        const isPureKeywordLine = keywordCandidates.length > 0 && keywordCandidates.every(k => {
          const baseWord = k.split(/\s+/)[0];
          return MTG_EVERGREEN_KEYWORDS.has(baseWord) || MTG_EVERGREEN_KEYWORDS.has(k);
        });

        if (isPureKeywordLine && keywordCandidates.length <= 4) {
          return (
            <div key={lineIdx} className="flex flex-wrap gap-1.5 py-1">
              {trimmed.split(/,\s*/).map((kw, kwIdx) => (
                <span
                  key={kwIdx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-fantasy font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-300 border border-amber-500/40 shadow-sm"
                >
                  ✦ {kw.trim()}
                </span>
              ))}
            </div>
          );
        }

        // 5. Regular rules text paragraph
        return (
          <p key={lineIdx} className="leading-relaxed text-xs sm:text-sm">
            {renderInlineTokens(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

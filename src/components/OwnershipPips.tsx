import React from 'react';
import { Card } from '../types/card';
import { UserCollection } from '../types/collection';
import { getCardOwnedCount, setCardOwnedCount } from '../services/ownershipService';

interface OwnershipPipsProps {
  card: Card;
  userCollection?: UserCollection;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showBadge?: boolean;
  onCountChange?: (newCount: number, updatedCollection: UserCollection) => void;
}

export const OwnershipPips: React.FC<OwnershipPipsProps> = ({
  card,
  userCollection = {},
  size = 'md',
  interactive = true,
  showBadge = false,
  onCountChange
}) => {
  const currentCount = getCardOwnedCount(card, userCollection);

  const handlePipClick = (e: React.MouseEvent, targetCount: number) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();

    // If clicking the current active count, decrement by 1 (or clear)
    const newCount = currentCount === targetCount ? targetCount - 1 : targetCount;
    const updated = setCardOwnedCount(card, newCount, userCollection);
    if (onCountChange) {
      onCountChange(newCount, updated);
    }
  };

  const pipSizeClass = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  const isPlayset = currentCount >= 4;

  return (
    <div 
      className="inline-flex items-center gap-1.5 select-none"
      onClick={e => e.stopPropagation()}
    >
      {showBadge && (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
          isPlayset 
            ? 'bg-emerald-600 text-white' 
            : currentCount > 0 
            ? 'bg-amber-500 text-slate-950 font-bold' 
            : 'bg-stone-800 text-stone-400'
        }`}>
          {currentCount}/4 {isPlayset ? 'Playset' : currentCount > 0 ? 'Owned' : '0x'}
        </span>
      )}

      {/* 4 Pips */}
      <div 
        className="flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-1 rounded-full border border-white/10"
        title={interactive ? `Owned: ${currentCount}/4. Click to change copies.` : `Owned: ${currentCount}/4`}
      >
        {[1, 2, 3, 4].map(pip => {
          const isFilled = currentCount >= pip;
          return (
            <button
              key={pip}
              type="button"
              disabled={!interactive}
              onClick={e => handlePipClick(e, pip)}
              className={`${pipSizeClass} rounded-full transition-all duration-150 ${
                interactive ? 'hover:scale-130 cursor-pointer' : 'cursor-default'
              } ${
                isFilled
                  ? 'bg-amber-400 ring-1 ring-amber-200 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : 'bg-stone-700/80 hover:bg-stone-500'
              }`}
              aria-label={`Mark as ${pip} copies owned`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OwnershipPips;

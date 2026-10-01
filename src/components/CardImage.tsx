import React, { useState, useEffect } from 'react';

export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  cardName?: string;
  fallbackSrc?: string;
}

export const CardImage: React.FC<CardImageProps> = ({
  src,
  cardName,
  alt,
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  const [errorStage, setErrorStage] = useState<number>(0);
  const [isBroken, setIsBroken] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(src || '');
    setErrorStage(0);
    setIsBroken(!src);
  }, [src]);

  const handleError = () => {
    if (errorStage === 0 && cardName) {
      // Step 1: Fallback to Scryfall named card endpoint
      const cleanName = cardName.replace(/^A-/, '').trim();
      setErrorStage(1);
      setImgSrc(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cleanName)}&format=image`);
    } else if (errorStage <= 1) {
      // Step 2: Fallback to official MTG Card Back
      setErrorStage(2);
      setImgSrc('https://cards.scryfall.io/back.png');
    } else {
      // Step 3: Complete fallback - card art placeholder
      setIsBroken(true);
    }
  };

  if (isBroken && (!imgSrc || errorStage >= 2)) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-center bg-stone-900 border border-amber-900/40 rounded-xl aspect-[5/7] select-none ${className}`}
      >
        <div className="w-8 h-8 rounded-full border border-amber-500/30 flex items-center justify-center mb-2 text-amber-500/70 text-xs font-serif">
          ✦
        </div>
        <span className="text-[11px] font-bold text-amber-200/90 line-clamp-3">
          {cardName || alt || 'MTG Arena'}
        </span>
        <span className="text-[9px] text-stone-500 mt-1 uppercase tracking-wider">
          Card Art
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc || (cardName ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image` : 'https://cards.scryfall.io/back.png')}
      alt={alt || cardName || 'Card image'}
      onError={handleError}
      className={className}
      loading={props.loading || 'lazy'}
      {...props}
    />
  );
};

import React, { useState, useEffect } from 'react';

export interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  cardName?: string;
  fallbackSrc?: string;
  artCrop?: boolean;
}

export const CardImage: React.FC<CardImageProps> = ({
  src,
  fallbackSrc,
  cardName,
  alt,
  className = '',
  artCrop = false,
  ...props
}) => {
  const getInitialSrc = (url?: string) => {
    if (!url) return '';
    if (artCrop && url.includes('cards.scryfall.io/')) {
      return url.replace('/normal/', '/art_crop/').replace('/large/', '/art_crop/').replace('/small/', '/art_crop/');
    }
    return url;
  };

  const [imgSrc, setImgSrc] = useState<string>(getInitialSrc(src));
  const [errorStage, setErrorStage] = useState<number>(0);
  const [isBroken, setIsBroken] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(getInitialSrc(src));
    setErrorStage(0);
    setIsBroken(!src && !cardName);
  }, [src, artCrop, cardName]);

  const handleError = () => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      return;
    }

    if (errorStage === 0 && cardName) {
      // Step 1: Fallback to Scryfall named card endpoint (with version=art_crop if requested)
      const cleanName = cardName.split(' // ')[0].replace(/^A-/, '').trim();
      setErrorStage(1);
      const cropQuery = artCrop ? '&version=art_crop' : '';
      setImgSrc(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cleanName)}&format=image${cropQuery}`);
    } else if (errorStage === 1 && artCrop && cardName) {
      // Step 1b: If art_crop specifically failed, try the full image before giving up
      const cleanName = cardName.split(' // ')[0].replace(/^A-/, '').trim();
      setErrorStage(2);
      setImgSrc(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cleanName)}&format=image`);
    } else if (errorStage <= 2) {
      // Step 2: Fallback to official MTG Card Back
      setErrorStage(3);
      setImgSrc('https://cards.scryfall.io/back.png');
    } else {
      // Step 3: Complete fallback - card art placeholder
      setIsBroken(true);
    }
  };

  if (isBroken && (!imgSrc || errorStage >= 3)) {
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

  const initialCleanName = cardName ? cardName.split(' // ')[0].replace(/^A-/, '').trim() : '';

  return (
    <img
      src={imgSrc || fallbackSrc || (initialCleanName ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(initialCleanName)}&format=image${artCrop ? '&version=art_crop' : ''}` : 'https://cards.scryfall.io/back.png')}
      alt={alt || cardName || 'Card image'}
      onError={handleError}
      className={className}
      loading={props.loading || 'lazy'}
      {...props}
    />
  );
};

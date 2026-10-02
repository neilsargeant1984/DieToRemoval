import { Card, CardFace } from '../types/card';

/**
 * Returns whether a card has multiple faces (e.g. double-faced, transform, split, flip).
 */
export function hasMultipleFaces(card?: Card | null): boolean {
  if (!card) return false;
  return Boolean(
    (card.cardFaces && card.cardFaces.length > 1) ||
    card.name.includes(' // ')
  );
}

/**
 * Retrieves the exact image URL for the requested face (isReverse = false for front face, true for reverse/back face).
 * Strictly preserves the card's specific printing, art variant, set, and artist.
 */
export function getCardFaceImageUrl(card?: Card | null, isReverse: boolean = false): string {
  if (!card) return 'https://cards.scryfall.io/back.png';

  const faceIndex = isReverse ? 1 : 0;

  // 1. If cardFaces has an explicit imageUrl that is already a valid image URL (not a broken/generic fallback)
  const explicitFaceImg = card.cardFaces?.[faceIndex]?.imageUrl;
  if (explicitFaceImg && !explicitFaceImg.includes('/cards/named')) {
    return explicitFaceImg;
  }

  // 2. Front face resolution:
  if (!isReverse) {
    if (explicitFaceImg) return explicitFaceImg;
    if (card.imageUrl) {
      if (card.imageUrl.includes('/back/')) {
        return card.imageUrl.replace('/back/', '/front/');
      }
      return card.imageUrl;
    }
    const cleanFrontName = (card.name || '').split(' // ')[0].replace(/^A-/, '').trim();
    return cleanFrontName
      ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cleanFrontName)}&format=image`
      : 'https://cards.scryfall.io/back.png';
  }

  // 3. Reverse / Back face resolution:
  // 3a. Direct Scryfall CDN swap: If the card's front imageUrl is from Scryfall (cards.scryfall.io)
  // and has '/front/', replacing '/front/' with '/back/' perfectly preserves the exact set,
  // collector number, artist, and print edition without ANY network redirect or mismatch.
  const baseImg = card.imageUrl || card.cardFaces?.[0]?.imageUrl;
  if (baseImg && baseImg.includes('/front/')) {
    return baseImg.replace('/front/', '/back/');
  }

  // 3b. Use Scryfall exact card ID (UUID) if available
  if (card.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id)) {
    return `https://api.scryfall.com/cards/${card.id}?format=image&face=back`;
  }

  // 3c. Use Set Code and Collector Number if available (e.g. pio/96)
  if (card.set && card.collectorNumber && card.set !== 'ARENA') {
    return `https://api.scryfall.com/cards/${card.set.toLowerCase()}/${card.collectorNumber}?format=image&face=back`;
  }

  // 3d. Fallback: query by the front-face name (Scryfall requires the front face name for face=back)
  const cleanFrontName = (card.name || '').split(' // ')[0].replace(/^A-/, '').trim();
  if (cleanFrontName) {
    return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cleanFrontName)}&format=image&face=back`;
  }

  return card.imageUrl || 'https://cards.scryfall.io/back.png';
}

/**
 * Returns face-specific metadata (name, type line, mana cost, oracle text, power, toughness, loyalty, imageUrl).
 */
export function getCardFaceData(card?: Card | null, isReverse: boolean = false) {
  if (!card) {
    return {
      name: '',
      typeLine: '',
      manaCost: '',
      oracleText: '',
      power: undefined as string | undefined,
      toughness: undefined as string | undefined,
      loyalty: undefined as string | undefined,
      imageUrl: 'https://cards.scryfall.io/back.png',
      hasReverse: false
    };
  }

  const multi = hasMultipleFaces(card);
  const faceIndex = isReverse && multi ? 1 : 0;
  const face: CardFace | undefined = card.cardFaces?.[faceIndex];

  // Names
  let name = face?.name;
  if (!name) {
    if (multi && card.name.includes(' // ')) {
      const parts = card.name.split(' // ');
      name = isReverse && parts[1] ? parts[1].trim() : parts[0].trim();
    } else {
      name = card.name;
    }
  }

  // Types
  let typeLine = face?.typeLine;
  if (!typeLine) {
    if (multi && card.typeLine?.includes(' // ')) {
      const parts = card.typeLine.split(' // ');
      typeLine = isReverse && parts[1] ? parts[1].trim() : parts[0].trim();
    } else {
      typeLine = card.typeLine || '';
    }
  }

  // Mana Cost
  let manaCost = face?.manaCost;
  if (manaCost === undefined) {
    if (multi && card.manaCost?.includes(' // ')) {
      const parts = card.manaCost.split(' // ');
      manaCost = isReverse && parts[1] ? parts[1].trim() : parts[0].trim();
    } else if (isReverse) {
      // Reverse faces of transform cards typically have no casting cost
      manaCost = '';
    } else {
      manaCost = card.manaCost || '';
    }
  }

  // Oracle Text
  let oracleText = face?.oracleText;
  if (!oracleText) {
    if (multi && card.oracleText) {
      // Split face oracle texts if formatted with face headers
      const parts = card.oracleText.split(/\n\n(?=[^:\n]+:\n)/);
      if (parts.length > 1) {
        oracleText = isReverse ? parts[1] : parts[0];
      } else {
        oracleText = card.oracleText;
      }
    } else {
      oracleText = card.oracleText || '';
    }
  }

  // Power / Toughness / Loyalty
  const power = face?.power !== undefined ? face.power : (!isReverse ? card.power : undefined);
  const toughness = face?.toughness !== undefined ? face.toughness : (!isReverse ? card.toughness : undefined);
  const loyalty = face?.loyalty !== undefined ? face.loyalty : (!isReverse ? card.loyalty : undefined);

  // Exact Face Image URL preserving art version
  const imageUrl = getCardFaceImageUrl(card, isReverse);

  return {
    name,
    typeLine,
    manaCost,
    oracleText,
    power,
    toughness,
    loyalty,
    imageUrl,
    hasReverse: multi
  };
}

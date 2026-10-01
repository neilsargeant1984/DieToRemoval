import { Card, FormatType } from '../types/card';

/**
 * Calculates the maximum number of copies of a card permitted in a deck,
 * honoring Magic: The Gathering rules and card-specific deckbuilding override text.
 * 
 * MTG Rules & Exceptions:
 * - Basic Lands (Plains, Island, Swamp, Mountain, Forest, Wastes, etc.): Unlimited (999)
 * - "A deck can have up to nine cards named Nazgûl." -> 9
 * - "A deck can have up to seven cards named Seven Dwarves." -> 7
 * - "A deck can have any number of cards named Hare Apparent." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Rat Colony." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Persistent Petitioners." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Dragon's Approach." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Slime Against Humanity." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Shadowborn Apostle." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Relentless Rats." -> 999 (Unlimited)
 * - "A deck can have any number of cards named Templar Knight." -> 999 (Unlimited)
 * - Standard Brawl Default: 1 (Singleton)
 * - Constructed 60-Card Default: 4
 */
export function getMaxCardCopies(card: Card, format?: FormatType): number {
  // 1. Basic Lands
  const isBasic = 
    (card.typeLine || '').toLowerCase().includes('basic') ||
    [
      'Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes',
      'Snow-Covered Plains', 'Snow-Covered Island', 'Snow-Covered Swamp',
      'Snow-Covered Mountain', 'Snow-Covered Forest'
    ].includes(card.name);

  if (isBasic) {
    return 999;
  }

  const text = (card.oracleText || '').toLowerCase();

  // 2. Oracle Text: "any number of cards named"
  if (/a deck can have any number of cards named/i.test(text)) {
    return 999;
  }

  // 3. Oracle Text: "up to [X] cards named"
  const upToMatch = text.match(/a deck can have up to (\w+|\d+) cards named/i);
  if (upToMatch) {
    const term = upToMatch[1].toLowerCase();
    const wordNumbers: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      twelve: 12, twenty: 20
    };
    if (wordNumbers[term] !== undefined) {
      return wordNumbers[term];
    }
    const parsed = parseInt(term, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // 4. Fallback lookup for known MTG Arena & Commander cards with custom deck limits
  const normalizedName = card.name.toLowerCase().trim();
  const KNOWN_OVERRIDES: Record<string, number> = {
    'nazgûl': 9,
    'nazgul': 9,
    'seven dwarves': 7,
    'hare apparent': 999,
    'persistent petitioners': 999,
    'rat colony': 999,
    'dragon\'s approach': 999,
    'dragons approach': 999,
    'slime against humanity': 999,
    'shadowborn apostle': 999,
    'relentless rats': 999,
    'templar knight': 999
  };

  if (KNOWN_OVERRIDES[normalizedName] !== undefined) {
    return KNOWN_OVERRIDES[normalizedName];
  }

  // 5. Format Defaults
  if (format === 'brawl') {
    return 1; // Strict singleton
  }

  return 4; // Standard 60-card maximum
}

/**
 * Checks whether a card has rule-modifying copy count permissions (e.g. Nazgûl, Hare Apparent, Basic Lands).
 */
export function allowsMultipleCopies(card: Card, format?: FormatType): boolean {
  return getMaxCardCopies(card, format) > 1;
}

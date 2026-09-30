import { Card } from '../types/card';
import { Deck, DeckCard } from '../types/deck';

// Official MTG Arena Brawl Banned List
export const ARENA_BRAWL_BANNED_CARDS = new Set([
  'Oko, Thief of Crowns',
  'Golos, Tireless Pilgrim',
  'Sorin of House Markov',
  'Channel',
  'Demonic Tutor',
  'Drannith Magistrate',
  'Gideon\'s Intervention',
  'Meddling Mage',
  'Pithing Needle',
  'Runed Halo',
  'Lutri, the Spellchaser',
  'Natural Order',
  'Nexus of Fate',
  'Time Warp',
  'Agent of Treachery',
  'Winota, Joiner of Forces',
  'Chulane, Teller of Tales'
]);

export interface BrawlValidationResult {
  isValid: boolean;
  hasCommander: boolean;
  colorViolations: { card: Card; illegalColors: string[] }[];
  bannedCards: Card[];
  duplicateCards: { name: string; quantity: number }[];
  deckSizeCount: number; // target: 100 (1 commander + 99 main) or 60 for Standard Brawl
  messages: string[];
}

/**
 * Checks if a card can be a Commander in MTG Arena Brawl (Legendary Creature or Planeswalker).
 */
export function canBeCommander(card: Card): boolean {
  const typeLine = (card.typeLine || '').toLowerCase();
  const isLegendary = typeLine.includes('legendary');
  const isCreature = typeLine.includes('creature');
  const isPlaneswalker = typeLine.includes('planeswalker');

  return (isLegendary && isCreature) || isPlaneswalker;
}

/**
 * Validates whether a card's color identity is legal under the Commander's color identity.
 */
export function isColorIdentityLegal(card: Card, commander: Card): boolean {
  const commanderColors = new Set(commander.colorIdentity);
  // Colorless cards are always legal in any color identity
  if (card.colorIdentity.length === 0) {
    return true;
  }
  // Every color on the card must exist in the commander's identity
  return card.colorIdentity.every(c => commanderColors.has(c));
}

/**
 * Checks if a card is banned in MTG Arena Brawl.
 */
export function isBannedInArenaBrawl(card: Card): boolean {
  if (ARENA_BRAWL_BANNED_CARDS.has(card.name)) {
    return true;
  }
  return card.legalities && card.legalities.brawl === false;
}

/**
 * Comprehensive Brawl deck validator.
 */
export function validateBrawlDeck(deck: Deck): BrawlValidationResult {
  const colorViolations: { card: Card; illegalColors: string[] }[] = [];
  const bannedCards: Card[] = [];
  const duplicateCards: { name: string; quantity: number }[] = [];
  const messages: string[] = [];

  const commander = deck.commander?.card;
  const hasCommander = !!commander;

  if (!hasCommander) {
    messages.push('Deck must have a Commander designated.');
  } else if (!canBeCommander(commander)) {
    messages.push(`Commander "${commander.name}" must be a Legendary Creature or Planeswalker.`);
  }

  const basicLands = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes']);

  // Check mainboard cards
  for (const item of deck.mainboard) {
    const { card, quantity } = item;

    // 1. Singleton Check
    if (!basicLands.has(card.name) && quantity > 1) {
      duplicateCards.push({ name: card.name, quantity });
      messages.push(`Singleton violation: ${quantity} copies of "${card.name}" (Max 1 allowed in Brawl).`);
    }

    // 2. Color Identity Check
    if (commander && !isColorIdentityLegal(card, commander)) {
      const illegalColors = card.colorIdentity.filter(c => !commander.colorIdentity.includes(c));
      colorViolations.push({ card, illegalColors });
      messages.push(`Color Identity violation: "${card.name}" contains {${illegalColors.join(',')}} outside Commander's colors.`);
    }

    // 3. Ban List Check
    if (isBannedInArenaBrawl(card)) {
      bannedCards.push(card);
      messages.push(`Banned in Brawl: "${card.name}" is currently on the MTG Arena banned list.`);
    }
  }

  const totalCards = (deck.mainboard.reduce((a, b) => a + b.quantity, 0)) + (hasCommander ? 1 : 0);

  const isValid = 
    hasCommander &&
    colorViolations.length === 0 &&
    bannedCards.length === 0 &&
    duplicateCards.length === 0;

  return {
    isValid,
    hasCommander,
    colorViolations,
    bannedCards,
    duplicateCards,
    deckSizeCount: totalCards,
    messages
  };
}

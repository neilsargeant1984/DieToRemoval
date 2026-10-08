import { Card } from '../types/card';
import { Deck, DeckCard } from '../types/deck';
import { getMaxCardCopies } from './cardRules';

export interface StandardValidationResult {
  isValid: boolean;
  illegalCards: Card[];
  duplicateCards: { name: string; quantity: number }[];
  deckSizeCount: number;
  messages: string[];
}

export function validateStandardDeck(deck: Deck): StandardValidationResult {
  const illegalCards: Card[] = [];
  const duplicateCards: { name: string; quantity: number }[] = [];
  const messages: string[] = [];

  let isValid = true;

  const mainboardCount = deck.mainboard.reduce((total, item) => total + item.quantity, 0);
  if (mainboardCount < 60) {
    isValid = false;
    messages.push(`Mainboard has ${mainboardCount} cards (minimum 60).`);
  }

  const sideboardCount = deck.sideboard ? deck.sideboard.reduce((total, item) => total + item.quantity, 0) : 0;
  if (sideboardCount > 15) {
    isValid = false;
    messages.push(`Sideboard has ${sideboardCount} cards (maximum 15).`);
  }

  const isBasicLand = (card: Card) =>
    (card.typeLine || '').toLowerCase().includes('basic') ||
    [
      'Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes',
      'Snow-Covered Plains', 'Snow-Covered Island', 'Snow-Covered Swamp',
      'Snow-Covered Mountain', 'Snow-Covered Forest'
    ].includes(card.name);

  const nameCounts = new Map<string, { qty: number; card: Card }>();
  
  const processItem = (item: DeckCard) => {
    if (!isBasicLand(item.card)) {
      const existing = nameCounts.get(item.card.name);
      if (existing) {
        existing.qty += item.quantity;
      } else {
        nameCounts.set(item.card.name, { qty: item.quantity, card: item.card });
      }
    }
  };

  deck.mainboard.forEach(processItem);
  if (deck.sideboard) deck.sideboard.forEach(processItem);

  for (const [name, { qty, card }] of nameCounts.entries()) {
    const maxAllowed = getMaxCardCopies(card, 'standard');
    if (qty > maxAllowed) {
      isValid = false;
      duplicateCards.push({ name, quantity: qty });
      messages.push(`Limit violation: ${qty} copies of "${name}" (Max ${maxAllowed} allowed).`);
    }
  }

  const checkLegality = (item: DeckCard) => {
    const { card } = item;
    if (isBasicLand(card)) return; // Basic lands are always legal
    if (card.legalities && card.legalities.standard === false) {
      isValid = false;
      if (!illegalCards.find(c => c.name === card.name)) {
        illegalCards.push(card);
        messages.push(`Not Standard Legal: "${card.name}".`);
      }
    }
  };

  deck.mainboard.forEach(checkLegality);
  if (deck.sideboard) deck.sideboard.forEach(checkLegality);

  return {
    isValid,
    illegalCards,
    duplicateCards,
    deckSizeCount: mainboardCount,
    messages
  };
}

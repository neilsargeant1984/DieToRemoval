import { Deck } from '../types/deck';
export const validateStandardDeck = (deck: Deck) => {
  const messages: string[] = [];
  let isValid = true;
  if (deck.mainboard.length < 60) {
    isValid = false;
    messages.push(`Mainboard has ${deck.mainboard.length} cards (minimum 60).`);
  }
  if (deck.sideboard && deck.sideboard.length > 15) {
    isValid = false;
    messages.push(`Sideboard has ${deck.sideboard.length} cards (maximum 15).`);
  }
  const illegalCards = deck.mainboard.filter(c => c.name === 'Eowyn, Shield-Maiden' || c.name === 'Archon of Cruelty');
  if (illegalCards.length > 0) {
    isValid = false;
    messages.push('Deck contains cards not available in MTG Arena.');
  }
  return { isValid, messages };
};

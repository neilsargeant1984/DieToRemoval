import { Deck } from '../types/deck';

export const analyzeStandardDeckHealth = (deck: Deck) => {
  const counts = { threats: 0, removal: 0, board_wipe: 0, card_advantage: 0, lands: 0 };
  
  deck.mainboard.forEach(item => {
    const card = item.card;
    const qty = item.quantity;
    const typeLine = (card.typeLine || '').toLowerCase();
    
    if (typeLine.includes('land')) {
      counts.lands += qty;
    } else if (typeLine.includes('creature') || typeLine.includes('planeswalker')) {
      counts.threats += qty;
    } else if (typeLine.includes('instant') || typeLine.includes('sorcery')) {
      counts.removal += qty;
    }
  });
  
  return {
    counts,
    targets: {
      threats: { optimal: 15 },
      removal: { optimal: 8 },
      board_wipe: { optimal: 2 },
      card_advantage: { optimal: 4 },
      lands: { optimal: 24 }
    }
  };
};

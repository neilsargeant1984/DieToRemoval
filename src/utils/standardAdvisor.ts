import { Deck } from '../types/deck';
export const analyzeStandardDeckHealth = (deck: Deck) => {
  const counts = { threats: 0, removal: 0, board_wipe: 0, card_advantage: 0, lands: 0 };
  deck.mainboard.forEach(card => {
    const typeLine = card.type_line || '';
    if (typeLine.includes('Land')) counts.lands += 1;
    else if (typeLine.includes('Creature') || typeLine.includes('Planeswalker')) counts.threats += 1;
    else if (typeLine.includes('Instant') || typeLine.includes('Sorcery')) counts.removal += 1;
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

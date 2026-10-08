import { Deck } from '../types/deck';
import { classifyCardRoles } from './roleClassifier';

export const analyzeStandardDeckHealth = (deck: Deck) => {
  const counts = { threats: 0, removal: 0, board_wipe: 0, card_advantage: 0, lands: 0 };
  
  deck.mainboard.forEach(item => {
    const card = item.card;
    const qty = item.quantity;
    
    if (card.types?.includes('Land') || (card.typeLine || '').toLowerCase().includes('land')) {
      counts.lands += qty;
      return;
    }

    const profile = classifyCardRoles(card);
    const roles = profile.roles;

    if (roles.includes('threats')) {
      counts.threats += qty;
    }
    if (roles.includes('board_wipe')) {
      counts.board_wipe += qty;
    } else if (roles.includes('removal')) {
      counts.removal += qty;
    }
    if (roles.includes('card_advantage')) {
      counts.card_advantage += qty;
    }
  });
  
  return {
    counts,
    targets: {
      threats: { optimal: 16 },
      removal: { optimal: 8 },
      board_wipe: { optimal: 2 },
      card_advantage: { optimal: 6 },
      lands: { optimal: 24 }
    }
  };
};

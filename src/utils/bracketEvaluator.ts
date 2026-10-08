import { Deck } from '../types/deck';
import { Card } from '../types/card';
import { 
  isHellQueueCommander, 
  getCardWeightInfo, 
  CardWeightInfo 
} from '../data/arenaCardWeights';

export type PowerTier = 'casual' | 'focused' | 'max_power';

export interface CardWeightMatch {
  card: Card;
  weightInfo: CardWeightInfo;
}

export interface DeckBracketReport {
  commanderName?: string;
  isHellQueueCommander: boolean;
  gameChangersFound: CardWeightMatch[];
  highWeightStaplesFound: CardWeightMatch[];
  totalEstimatedWeight: number;
  currentBracket: 1 | 2 | 3 | 4;
  currentBracketLabel: string;
  currentTier: PowerTier;
  isHellQueueDeck: boolean;
  hellQueueWarning?: string;
  recommendationHint: string;
}

/**
 * Evaluates a deck's power level according to WotC's 2025 4-Bracket System
 * and calculates estimated MTG Arena Matchmaking Deck Weight.
 */
export function evaluateDeckBracket(deck: Deck): DeckBracketReport {
  const commanderCard = deck.commander?.card;
  const commanderName = commanderCard?.name;
  const isCommanderHell = isHellQueueCommander(commanderName);

  // Baseline commander weight: 1,800 for Hell Queue commanders; 250 for regular commanders
  let totalWeight = isCommanderHell ? 1800 : 250;

  const gameChangersFound: CardWeightMatch[] = [];
  const highWeightStaplesFound: CardWeightMatch[] = [];

  const mainboardCards = deck.mainboard || [];

  for (const item of mainboardCards) {
    const card = item.card;
    const info = getCardWeightInfo(card.name);

    if (info) {
      totalWeight += info.weight * item.quantity;

      if (info.isGameChanger) {
        gameChangersFound.push({ card, weightInfo: info });
      } else if (info.weight >= 250) {
        highWeightStaplesFound.push({ card, weightInfo: info });
      }
    } else {
      // Default baseline card weight on MTG Arena (~15 pts for standard playable cards)
      if (!card.types.includes('Land')) {
        totalWeight += 15 * item.quantity;
      }
    }
  }

  const gcCount = gameChangersFound.length;

  // Determine WotC Bracket (1 to 4)
  // Bracket 1: 0 Game Changers, low weight, thematic
  // Bracket 2: <= 1 Game Changer, moderate weight (< 750)
  // Bracket 3: 2-3 Game Changers OR high weight (750 - 1400)
  // Bracket 4: >= 4 Game Changers OR Hell-Queue commander OR weight >= 1400
  let bracket: 1 | 2 | 3 | 4 = 2;
  let bracketLabel = 'Bracket 2 (Core Casual)';
  let tier: PowerTier = 'casual';

  if (isCommanderHell || gcCount >= 4 || totalWeight >= 1500) {
    bracket = 4;
    bracketLabel = 'Bracket 4 (cEDH / Hell-Queue)';
    tier = 'max_power';
  } else if (gcCount >= 2 || totalWeight >= 850) {
    bracket = 3;
    bracketLabel = 'Bracket 3 (Optimized)';
    tier = 'focused';
  } else if (gcCount === 0 && totalWeight < 500) {
    bracket = 1;
    bracketLabel = 'Bracket 1 (Exhibition / Flavor)';
    tier = 'casual';
  } else {
    bracket = 2;
    bracketLabel = 'Bracket 2 (Core Casual)';
    tier = 'casual';
  }

  // Determine if deck gets pushed into MTG Arena's Hell-Queue matchmaking
  const isHellQueueDeck = isCommanderHell || totalWeight >= 1200 || gcCount >= 3;

  let hellQueueWarning: string | undefined;
  if (!isCommanderHell && isHellQueueDeck) {
    const topStapleNames = [...gameChangersFound, ...highWeightStaplesFound]
      .slice(0, 3)
      .map(m => m.card.name)
      .join(', ');

    hellQueueWarning = `⚠️ Matchmaking Alert: Adding high-weight staples (${topStapleNames}) spikes your Arena deck weight (${totalWeight} pts). Arena will likely pair this deck against Tier 1 Hell-Queue commanders (Kinnan, Golos, Rusko).`;
  }

  let recommendationHint = '';
  if (tier === 'casual') {
    recommendationHint = 'Focus on on-theme synergies and fun mechanics. Avoid adding format-warping staples to keep your matchmaking casual.';
  } else if (tier === 'focused') {
    recommendationHint = 'Balanced high-synergy engine with efficient removal and mana curves.';
  } else {
    recommendationHint = 'Maximum power: prioritize 0-1 mana interaction, fast tutors, mana rocks, and game changers.';
  }

  return {
    commanderName,
    isHellQueueCommander: isCommanderHell,
    gameChangersFound,
    highWeightStaplesFound,
    totalEstimatedWeight: totalWeight,
    currentBracket: bracket,
    currentBracketLabel: bracketLabel,
    currentTier: tier,
    isHellQueueDeck,
    hellQueueWarning,
    recommendationHint
  };
}

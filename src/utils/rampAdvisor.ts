import { Card } from '../types/card';
import { DeckCard } from '../types/deck';
import { classifyCardRoles } from './roleClassifier';

export interface RoleCountSummary {
  ramp: number;
  protection: number;
  removal: number;
  board_wipe: number;
  card_advantage: number;
  lands: number;
}

export interface OptimalRoleTargets {
  ramp: { min: number; max: number; optimal: number; targetRampCmc: number };
  protection: { min: number; max: number; optimal: number };
  removal: { min: number; max: number; optimal: number };
  board_wipe: { min: number; max: number; optimal: number };
  card_advantage: { min: number; max: number; optimal: number };
  lands: { min: number; max: number; optimal: number };
}

export interface DeckHealthAnalysis {
  counts: RoleCountSummary;
  targets: OptimalRoleTargets;
  averageNonLandCmc: number;
  commanderCmc?: number;
  coachingAdvice: string[];
  turnOnCurveProbability: number; // e.g. 78%
  turnAcceleratedProbability: number; // e.g. 62%
}

/**
 * Dynamically computes optimal deck skeleton targets based on Frank Karsten's mana equations.
 */
export function analyzeBrawlDeckHealth(
  mainboard: DeckCard[],
  commander?: Card
): DeckHealthAnalysis {
  let totalNonLandCmc = 0;
  let nonLandCount = 0;
  let landCount = 0;

  const counts: RoleCountSummary = {
    ramp: 0,
    protection: 0,
    removal: 0,
    board_wipe: 0,
    card_advantage: 0,
    lands: 0
  };

  // Analyze every card in the deck
  for (const item of mainboard) {
    const { card, quantity } = item;
    if (card.types.includes('Land')) {
      landCount += quantity;
      counts.lands += quantity;
    } else {
      nonLandCount += quantity;
      totalNonLandCmc += card.cmc * quantity;

      const profile = classifyCardRoles(card);
      for (const role of profile.roles) {
        if (role in counts) {
          counts[role as keyof RoleCountSummary] += quantity;
        }
      }
    }
  }

  const averageNonLandCmc = nonLandCount > 0 
    ? Number((totalNonLandCmc / nonLandCount).toFixed(2)) 
    : 3.0;

  const cmdCmc = commander ? commander.cmc : 4;

  // Compute Optimal Targets dynamically based on Commander CMC & Average CMC
  // High curve / big commander = significantly more ramp & lands
  let targetLands = 37;
  let targetRamp = 10;
  let targetRampCmc = 2; // Default to 2-mana ramp

  if (cmdCmc <= 3 && averageNonLandCmc <= 2.4) {
    // Aggro curve (e.g. Ragavan, Heartfire Hero, Sorin)
    targetLands = 35;
    targetRamp = 6;
    targetRampCmc = 1;
  } else if (cmdCmc === 4) {
    // 4-CMC Midrange (e.g. Sheoldred, Rusko) -> Wants Turn 3 cast via 2-mana ramp!
    targetLands = 37;
    targetRamp = 10;
    targetRampCmc = 2;
  } else if (cmdCmc === 5) {
    // 5-CMC Commander -> 2-mana or 3-mana ramp
    targetLands = 37;
    targetRamp = 11;
    targetRampCmc = 2;
  } else if (cmdCmc >= 6) {
    // Big Mana / Control (e.g. Atraxa, Nicol Bolas, Etali)
    targetLands = 39;
    targetRamp = 13;
    targetRampCmc = 2; // Needs ramp chain (2 into 4)
  }

  // Adjusted slightly by average deck CMC
  if (averageNonLandCmc > 3.4 && targetRamp < 14) {
    targetRamp += 1;
    targetLands += 1;
  }

  const targets: OptimalRoleTargets = {
    ramp: { min: targetRamp - 2, max: targetRamp + 2, optimal: targetRamp, targetRampCmc },
    protection: { min: 3, max: 6, optimal: 4 },
    removal: { min: 8, max: 12, optimal: 10 },
    board_wipe: { min: 2, max: 5, optimal: 3 },
    card_advantage: { min: 8, max: 12, optimal: 10 },
    lands: { min: targetLands - 1, max: targetLands + 2, optimal: targetLands }
  };

  // Coaching Advice Generation
  const coachingAdvice: string[] = [];

  // Ramp advice
  if (counts.ramp < targets.ramp.min) {
    const deficit = targets.ramp.optimal - counts.ramp;
    if (cmdCmc === 4) {
      coachingAdvice.push(
        `Add ~${deficit} more 2-mana ramp pieces (like Arcane Signet, Coldsteel Heart, Mind Stone) to cast your Commander on Turn 3 consistently.`
      );
    } else if (cmdCmc >= 6) {
      coachingAdvice.push(
        `Your Commander costs ${cmdCmc} mana. Add ~${deficit} more ramp pieces to accelerate past turns 3-5 safely.`
      );
    } else {
      coachingAdvice.push(`Add ~${deficit} more ramp pieces to avoid falling behind on mana development.`);
    }
  } else if (counts.ramp > targets.ramp.max) {
    coachingAdvice.push(`You have plenty of ramp (${counts.ramp} pieces). Consider swapping high-CMC ramp for threats or card draw.`);
  }

  // Removal & Wipes advice
  if (counts.removal < targets.removal.min) {
    coachingAdvice.push(`Low on spot removal (${counts.removal}/${targets.removal.optimal}). Add 2-3 instant-speed interaction spells to disrupt opponent commanders.`);
  }
  if (counts.board_wipe < targets.board_wipe.min && cmdCmc >= 5) {
    coachingAdvice.push(`Control/high-curve decks need at least ${targets.board_wipe.optimal} board sweepers to reset fast aggressive starts.`);
  }

  // Protection advice
  if (counts.protection < targets.protection.min && cmdCmc >= 4) {
    coachingAdvice.push(`Your Commander is a high-priority target. Add 1-2 protection spells (Swiftfoot Boots, hexproof, or phase-out) to prevent tempo loss from removal.`);
  }

  // Cast probabilities (Hypergeometric approximation for Brawl 99-card deck)
  // Probability of drawing at least 1 ramp spell in opening 7 cards + turn 2 draw:
  // p = 1 - hypergeom(0; 99, counts.ramp, 8)
  const N = 99;
  const K = counts.ramp;
  const n = 8; // cards seen by turn 2
  
  // Quick hypergeometric 0-hit probability: prod_{i=0}^{n-1} (N - K - i) / (N - i)
  let pZeroRamp = 1.0;
  for (let i = 0; i < n; i++) {
    pZeroRamp *= Math.max(0, (N - K - i)) / (N - i);
  }
  const turnAcceleratedProbability = Math.round((1 - pZeroRamp) * 100);

  // Turn on-curve land drop probability (hitting 3-4 lands by turn 3-4)
  const turnOnCurveProbability = Math.min(95, Math.round(50 + (counts.lands * 1.1)));

  return {
    counts,
    targets,
    averageNonLandCmc,
    commanderCmc: cmdCmc,
    coachingAdvice,
    turnOnCurveProbability,
    turnAcceleratedProbability
  };
}

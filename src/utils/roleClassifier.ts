import { Card } from '../types/card';

export type FunctionalRole = 
  | 'ramp' 
  | 'protection' 
  | 'removal' 
  | 'board_wipe' 
  | 'card_advantage' 
  | 'tutor';

export interface CardRoleProfile {
  roles: FunctionalRole[];
  primaryRole?: FunctionalRole;
  rampType?: 'mana_rock' | 'dork' | 'land_fetch' | 'ritual';
  rampCmc?: number;
  explanation: string[];
}

/**
 * Universal functional role classifier that analyzes any Magic card's rules text and types.
 */
export function classifyCardRoles(card: Card): CardRoleProfile {
  const text = (card.oracleText || '').toLowerCase();
  const typeLine = (card.typeLine || '').toLowerCase();
  const roles: FunctionalRole[] = [];
  const explanations: string[] = [];
  let rampType: 'mana_rock' | 'dork' | 'land_fetch' | 'ritual' | undefined;

  // 1. RAMP CLASSIFICATION (Excludes standard lands)
  if (!card.types.includes('Land')) {
    const isManaRock = card.types.includes('Artifact') && (
      text.includes('{t}: add ') || 
      text.includes('{t}, sacrifice') || 
      text.includes('add one mana of any') ||
      text.includes('add {')
    );

    const isManaDork = card.types.includes('Creature') && (
      text.includes('{t}: add ') || 
      text.includes('add one mana of any') || 
      text.includes('whenever you cast') && text.includes('add {')
    );

    const isLandFetch = 
      text.includes('search your library for a') && (
        text.includes('land card') || 
        text.includes('basic land') || 
        text.includes('forest') || 
        text.includes('plains') || 
        text.includes('island') || 
        text.includes('swamp') || 
        text.includes('mountain')
      ) && (text.includes('onto the battlefield') || text.includes('put that card onto the battlefield'));

    const isRitual = (card.types.includes('Instant') || card.types.includes('Sorcery')) && (
      text.includes('add {') && (text.includes('add {b}{b}{b}') || text.includes('add {r}{r}{r}') || text.includes('mana in any combination'))
    );

    const isTreasureGenerator = 
      text.includes('create a treasure token') || 
      text.includes('create two treasure tokens') ||
      text.includes('create three treasure tokens');

    if (isManaRock || isManaDork || isLandFetch || isRitual || (isTreasureGenerator && card.cmc <= 3)) {
      roles.push('ramp');
      if (isManaRock) {
        rampType = 'mana_rock';
        explanations.push(`Mana Rock (CMC ${card.cmc})`);
      } else if (isManaDork) {
        rampType = 'dork';
        explanations.push(`Mana Dork (CMC ${card.cmc})`);
      } else if (isLandFetch) {
        rampType = 'land_fetch';
        explanations.push('Land Ramp / Tutor to Battlefield');
      } else if (isRitual) {
        rampType = 'ritual';
        explanations.push('Mana Ritual');
      } else if (isTreasureGenerator) {
        rampType = 'mana_rock';
        explanations.push('Treasure Mana Acceleration');
      }
    }
  }

  // 2. BOARD WIPES (Mass Removals)
  const isWipe = 
    (text.includes('destroy all') && (text.includes('creature') || text.includes('nonland') || text.includes('permanent'))) ||
    (text.includes('exile all') && (text.includes('creature') || text.includes('nonland') || text.includes('permanent'))) ||
    text.includes('each creature gets -') ||
    text.includes('all creatures get -') ||
    text.includes('deals damage to each creature') && (card.cmc >= 3 || text.includes('x damage')) ||
    text.includes('destroy each creature') ||
    text.includes('exile each creature') ||
    text.includes('incubate x, where x is the number of creatures exiled');

  if (isWipe) {
    roles.push('board_wipe');
    explanations.push('Mass Board Sweeper');
  }

  // 3. TARGETED REMOVAL & INTERACTION (Single target destroy, exile, counter, bounce)
  const isTargetedRemoval = !isWipe && (
    (text.includes('destroy target') || text.includes('exile target') || text.includes('target creature gets -')) ||
    (text.includes('counter target') && (text.includes('spell') || text.includes('ability'))) ||
    (text.includes('return target') && (text.includes('to its owner\'s hand') || text.includes('to their owner\'s hand'))) ||
    (text.includes('deals') && text.includes('damage to target') && (card.types.includes('Instant') || card.types.includes('Sorcery'))) ||
    (text.includes('deals 3 damage to any target') || text.includes('deals 4 damage to any target'))
  );

  if (isTargetedRemoval) {
    roles.push('removal');
    explanations.push('Targeted Spot Removal / Interaction');
  }

  // 4. PROTECTION (Hexproof, Indestructible, Phase Out, Ward, Shield Counters)
  const isProtection = 
    (text.includes('hexproof') || 
     text.includes('indestructible') || 
     text.includes('phase out') || 
     text.includes('protection from') || 
     text.includes('can\'t be countered') ||
     text.includes('shield counter') ||
     (text.includes('ward {') && (card.types.includes('Artifact') || card.types.includes('Enchantment')))) &&
    // Don't classify generic big creatures as "protection spells" unless they grant it or equip it
    (card.types.includes('Instant') || card.types.includes('Artifact') || card.types.includes('Enchantment') || text.includes('target creature you control gains') || text.includes('creatures you control gain'));

  if (isProtection) {
    roles.push('protection');
    explanations.push('Commander & Board Protection');
  }

  // 5. CARD ADVANTAGE & DRAW ENGINES
  const isCardAdvantage = 
    text.includes('draw a card') || 
    text.includes('draw two cards') || 
    text.includes('draw three cards') || 
    text.includes('draws a card') ||
    text.includes('draw cards equal to') ||
    text.includes('investigate') ||
    (text.includes('exile the top') && text.includes('you may play')) ||
    (text.includes('look at the top') && text.includes('put') && text.includes('into your hand'));

  if (isCardAdvantage && !isWipe) {
    roles.push('card_advantage');
    explanations.push('Card Advantage / Draw Engine');
  }

  // 6. TUTORS
  const isTutor = 
    text.includes('search your library for a card') ||
    (text.includes('search your library for a') && !roles.includes('ramp'));

  if (isTutor) {
    roles.push('tutor');
    explanations.push('Library Search / Tutor');
  }

  return {
    roles,
    primaryRole: roles[0],
    rampType,
    rampCmc: roles.includes('ramp') ? card.cmc : undefined,
    explanation: explanations
  };
}

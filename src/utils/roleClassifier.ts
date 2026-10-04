import { Card } from '../types/card';

export type FunctionalRole = 
  | 'ramp' 
  | 'protection' 
  | 'removal' 
  | 'board_wipe' 
  | 'card_advantage' 
  | 'sac_outlet'
  | 'recursion'
  | 'drain'
  | 'mdfc_land'
  | 'utility_land'
  | 'graveyard_hate'
  | 'tutor'
  | 'threats'
  | 'sideboard';

export interface CardRoleProfile {
  roles: FunctionalRole[];
  primaryRole?: FunctionalRole;
  rampType?: 'mana_rock' | 'dork' | 'land_fetch' | 'ritual';
  rampCmc?: number;
  explanation: string[];
}

export interface RoleChip {
  id: FunctionalRole;
  label: string;
  icon: string;
  style: string;
}

/**
 * Universal functional role classifier that analyzes any Magic card's rules text and types.
 */
export function classifyCardRoles(card: Card, commander?: Card): CardRoleProfile {
  const text = (card.oracleText || '').toLowerCase();
  const typeLine = (card.typeLine || '').toLowerCase();
  const roles: FunctionalRole[] = [];
  const explanations: string[] = [];
  let rampType: 'mana_rock' | 'dork' | 'land_fetch' | 'ritual' | undefined;

  const isOffColorRestricted = (colorName: string, colorCode: 'W' | 'U' | 'B' | 'R' | 'G') => {
    if (!commander) return false;
    return !commander.colorIdentity.includes(colorCode);
  };

  if (!card.types.includes('Land')) {
    const isManaRock = card.types.includes('Artifact') && (
      (text.includes('{t}: add ') || text.includes('add one mana of any') || (text.includes('add {') && (text.includes('{t}') || text.includes('sacrifice')))) ||
      (text.includes('{t}, sacrifice') && (text.includes('add ') || text.includes('mana')))
    );

    const isManaDork = card.types.includes('Creature') && (
      text.includes('{t}: add ') || 
      text.includes('add one mana of any') || 
      (text.includes('whenever you cast') && text.includes('add {'))
    );

    const basicLandTypes: { name: string; code: 'W' | 'U' | 'B' | 'R' | 'G' }[] = [
      { name: 'plains', code: 'W' },
      { name: 'island', code: 'U' },
      { name: 'swamp', code: 'B' },
      { name: 'mountain', code: 'R' },
      { name: 'forest', code: 'G' }
    ];
    let isOffColorLandFetch = false;
    for (const b of basicLandTypes) {
      if (text.includes(b.name) && !text.includes('land') && isOffColorRestricted(b.name, b.code)) {
        isOffColorLandFetch = true;
      }
    }

    const isLandFetch = !isOffColorLandFetch &&
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

    const isCostReductionRamp = 
      text.includes('spells you cast cost') || 
      text.includes('creature spells you cast cost');

    let isOffColorCostReduction = false;
    if (isCostReductionRamp && commander) {
      for (const b of basicLandTypes) {
        const colorName = b.name === 'plains' ? 'white' : b.name === 'island' ? 'blue' : b.name === 'swamp' ? 'black' : b.name === 'mountain' ? 'red' : 'green';
        if (text.includes(`${colorName} creature spells you cast cost`) && isOffColorRestricted(colorName, b.code)) {
          isOffColorCostReduction = true;
        }
      }
    }

    const isTaxOrPassiveTreasureRamp = 
      card.name.toLowerCase() === 'smothering tithe' || 
      (card.types.includes('Enchantment') && isTreasureGenerator);

    if (!isOffColorCostReduction && (isManaRock || isManaDork || isLandFetch || isRitual || (isTreasureGenerator && card.cmc <= 3) || isTaxOrPassiveTreasureRamp)) {
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
      } else if (isTreasureGenerator || isTaxOrPassiveTreasureRamp) {
        rampType = 'mana_rock';
        explanations.push('Treasure Mana Acceleration');
      }
    }
  } else if (card.name === 'Phyrexian Tower' || (text.includes('add {') && text.includes('sacrifice a creature'))) {
    roles.push('ramp');
    explanations.push('Sacrifice Mana Acceleration');
  }

  if (!card.types.includes('Land') && (card.types.includes('Creature') || card.types.includes('Planeswalker'))) {
    if (!roles.includes('ramp') && !roles.includes('sac_outlet')) { 
       roles.push('threats');
       explanations.push('Threat / Board Presence');
    }
  }

  const isSacOutlet = 
    text.includes('sacrifice a creature:') ||
    text.includes('sacrifice another creature:') ||
    text.includes('sacrifice a creature or') ||
    text.includes('sacrifice an artifact or creature') ||
    text.includes('additional cost to cast this spell, sacrifice a creature') ||
    text.includes('additional cost to cast this spell, sacrifice an artifact or creature') ||
    text.includes('additional cost to cast this spell, sacrifice') ||
    text.includes('{t}, sacrifice a creature') ||
    text.includes('{t}, sacrifice another creature') ||
    text.includes('sacrifice a nonland permanent:') ||
    text.includes('sacrifice another creature or') ||
    text.includes('sacrifice another permanent:') ||
    [
      'deadly dispute', 'village rites', 'corrupted conviction', 'victimize',
      'ashnod\'s altar', 'phyrexian altar', 'altar of dementia', 'phyrexian tower',
      'viscera seer', 'woe strider', 'dockside chef', 'high market', 'plumb the forbidden',
      'eaten alive', 'severed strands', 'bartolomé del presidio', 'ayara, first of locthwain',
      'yawgmoth, thran physician', 'hostile hostel', 'diabolic intent', 'warren soultrader',
      'braids, arisen nightmare', 'carrion feeder', 'fell stinger', 'fanatical offering'
    ].includes(card.name.toLowerCase());

  if (isSacOutlet) {
    roles.push('sac_outlet');
    explanations.push('Sacrifice Outlet & Death Catalyst');
  }

  const isWipe = 
    (text.includes('destroy all') && (text.includes('creature') || text.includes('nonland') || text.includes('permanent'))) ||
    (text.includes('exile all') && (text.includes('creature') || text.includes('nonland') || text.includes('permanent'))) ||
    text.includes('each creature gets -') ||
    text.includes('all creatures get -') ||
    (text.includes('deals damage to each creature') && (card.cmc >= 3 || text.includes('x damage'))) ||
    text.includes('destroy each creature') ||
    text.includes('exile each creature') ||
    text.includes('incubate x, where x is the number of creatures exiled');

  if (isWipe) {
    roles.push('board_wipe');
    explanations.push('Mass Board Sweeper');
  }

  const isGyHateOnly = text.includes('from a graveyard') || text.includes('from target player\'s graveyard') || text.includes('from all graveyards');
  const isInstantOrSorcery = card.types.includes('Instant') || card.types.includes('Sorcery');

  const isTargetedRemoval = (
    text.includes('destroy target') || 
    (text.includes('exile target') && !isGyHateOnly) || 
    text.includes('target creature gets -') ||
    text.includes('target nonland permanent gets -') ||
    text.includes('put a -1/-1 counter on') ||
    text.includes('put two -1/-1 counters on') ||
    (text.includes('counter target') && (text.includes('spell') || text.includes('ability'))) ||
    (text.includes('return target') && (text.includes('to its owner\'s hand') || text.includes('to their owner\'s hand'))) ||
    (isInstantOrSorcery && (
      (text.includes('deals') && text.includes('damage to target')) ||
      text.includes('deals 3 damage to any target') || 
      text.includes('deals 4 damage to any target') ||
      text.includes('deals 5 damage to any target')
    )) ||
    (card.types.includes('Creature') && (
      text.includes('enters the battlefield, destroy target') || 
      text.includes('enters, destroy target') || 
      (text.includes('enters the battlefield, exile target') && !isGyHateOnly) ||
      (text.includes('enters, exile target') && !isGyHateOnly) ||
      text.includes('deals 1 damage to any target') ||
      text.includes('deals 2 damage to any target') ||
      text.includes('deals damage to any target') ||
      card.name.toLowerCase() === 'orcish bowmasters'
    ))
  );

  if (isTargetedRemoval) {
    roles.push('removal');
    explanations.push('Targeted Spot Removal / Interaction');
  }

  const isRecursion = 
    (text.includes('return target') && (text.includes('graveyard to the battlefield') || text.includes('graveyard onto the battlefield'))) ||
    (text.includes('put target') && (text.includes('graveyard to the battlefield') || text.includes('graveyard onto the battlefield'))) ||
    (text.includes('return target') && text.includes('graveyard to your hand') && !card.types.includes('Land')) ||
    text.includes('reanimate') ||
    card.name.toLowerCase() === 'victimize';

  if (isRecursion) {
    roles.push('recursion');
    explanations.push('Graveyard Recursion / Reanimation');
  }

  const textWithoutSelfTransform = text
    .replace(/exile\s+[a-z\s,']+\s*,\s*then\s+return\s+(him|her|it|them)\s+to\s+the\s+battlefield\s+transformed/gi, '')
    .replace(/exile\s+[a-z\s,']+\s*transformed/gi, '');

  const KNOWN_GY_HATE_CARDS = [
    'rest in peace', 'leyline of the void', 'soul-guide lantern', 'bojuka bog',
    'tormod\'s crypt', 'grafdigger\'s cage', 'unlicensed hearse', 'dauthi voidwalker',
    'weathered runestone', 'relic of progenitus', 'lantern of the lost', 'lion sash',
    'graveyard trespasser', 'cling to dust', 'kunoros, hound of athreos', 'stone of erech',
    'ghost vacuum', 'ashiok, dream render', 'containment priest'
  ];

  const isGraveyardHate = !roles.includes('recursion') && (
    KNOWN_GY_HATE_CARDS.includes(card.name.toLowerCase().trim()) ||
    textWithoutSelfTransform.includes('exile target card from a graveyard') ||
    textWithoutSelfTransform.includes('exile target card from target opponent\'s graveyard') ||
    textWithoutSelfTransform.includes('exile target card from an opponent\'s graveyard') ||
    textWithoutSelfTransform.includes('exile all cards from all graveyards') ||
    textWithoutSelfTransform.includes('exile all cards from target player\'s graveyard') ||
    textWithoutSelfTransform.includes('exile all cards from target opponent\'s graveyard') ||
    textWithoutSelfTransform.includes('exile target player\'s graveyard') ||
    textWithoutSelfTransform.includes('exile that player\'s graveyard') ||
    textWithoutSelfTransform.includes('exile target opponent\'s graveyard') ||
    (textWithoutSelfTransform.includes('exile up to') && textWithoutSelfTransform.includes('cards from a graveyard')) ||
    textWithoutSelfTransform.includes('cards in graveyards can\'t') ||
    textWithoutSelfTransform.includes('can\'t cast spells from graveyards') ||
    textWithoutSelfTransform.includes('can\'t enter the battlefield from a graveyard') ||
    textWithoutSelfTransform.includes('put into a graveyard from anywhere, exile it instead') ||
    textWithoutSelfTransform.includes('would be put into an opponent\'s graveyard, exile') ||
    textWithoutSelfTransform.includes('would be put into a graveyard, exile it instead')
  );

  if (isGraveyardHate) {
    roles.push('graveyard_hate');
    explanations.push('Graveyard Hate / Interaction');
  }

  const isProtection = 
    (text.includes('hexproof') || 
     text.includes('indestructible') || 
     text.includes('phase out') || 
     text.includes('protection from') || 
     text.includes('can\'t be countered') ||
     text.includes('shield counter') ||
     (text.includes('ward {') && (card.types.includes('Artifact') || card.types.includes('Enchantment')))) &&
    (card.types.includes('Instant') || card.types.includes('Artifact') || card.types.includes('Enchantment') || text.includes('target creature you control gains') || text.includes('creatures you control gain'));

  if (isProtection) {
    roles.push('protection');
    explanations.push('Commander & Board Protection');
  }

  const textWithoutOpponentDraw = text
    .replace(/(whenever|if)\s+(an?\s+opponent|target\s+opponent|each\s+opponent|opponents)\s+draws?\s+(a\s+card|\d+\s+cards?|cards?)[^.]*\./gi, '')
    .replace(/except\s+the\s+first\s+one\s+they\s+draw[^.]*\./gi, '')
    .replace(/for\s+each\s+card\s+(an?\s+opponent|target\s+opponent|each\s+opponent|opponents)\s+has\s+drawn/gi, '');

  const isCardAdvantage = 
    textWithoutOpponentDraw.includes('draw a card') || 
    textWithoutOpponentDraw.includes('draw two cards') || 
    textWithoutOpponentDraw.includes('draw three cards') || 
    textWithoutOpponentDraw.includes('draws a card') ||
    textWithoutOpponentDraw.includes('draw cards equal to') ||
    textWithoutOpponentDraw.includes('you draw') ||
    text.includes('investigate') ||
    (text.includes('exile the top') && (text.includes('you may play') || text.includes('you may cast'))) ||
    (text.includes('look at the top') && text.includes('put') && text.includes('into your hand'));

  if (isCardAdvantage) {
    roles.push('card_advantage');
    explanations.push('Card Advantage / Draw Engine');
  }

  const isDrain = 
    ((text.includes('each opponent loses') || text.includes('target opponent loses') || text.includes('each player loses')) && text.includes('you gain')) ||
    (text.includes('whenever a creature') && text.includes('dies') && (text.includes('loses 1 life') || text.includes('loses life') || text.includes('deals 1 damage to each opponent')));

  if (isDrain) {
    roles.push('drain');
    explanations.push('Life Drain / Aristocrat Ping');
  }

  const isLandSearch = 
    text.includes('basic land') || 
    text.includes('plains, island') ||
    text.includes('plains or island') ||
    text.includes('swamp or mountain') ||
    text.includes('forest or') ||
    text.includes('mountain or') ||
    text.includes('island or') ||
    text.includes('plains or') ||
    text.includes('swamp or') ||
    text.includes('search your library for a land card');

  const isTutor = 
    !card.types.includes('Land') &&
    !isLandSearch &&
    (
      text.includes('search your library for a card') ||
      text.includes('search your library for an artifact') ||
      text.includes('search your library for an enchantment') ||
      text.includes('search your library for a creature') ||
      text.includes('search your library for an instant') ||
      (text.includes('search your library for a') && !roles.includes('ramp'))
    );

  if (isTutor) {
    roles.push('tutor');
    explanations.push('Library Search / Tutor');
  }

  const isMdfcLand = 
    (typeLine.includes('//') && typeLine.includes('land')) || 
    (card.types.includes('Land') && (card.types.includes('Instant') || card.types.includes('Sorcery') || card.types.includes('Creature') || card.types.includes('Artifact') || card.types.includes('Enchantment')));

  if (isMdfcLand) {
    roles.unshift('mdfc_land');
    explanations.unshift('Modal Double-Faced Land (Spell on front, Land on back)');
  } else {
    const isLand = card.types.includes('Land') || typeLine.includes('land');
    if (isLand && roles.length > 0) {
      roles.unshift('utility_land');
      explanations.unshift('Utility Land (Provides on-board tactical utility from mana base)');
    }
  }

  return {
    roles,
    primaryRole: roles[0],
    rampType,
    rampCmc: roles.includes('ramp') ? card.cmc : undefined,
    explanation: explanations
  };
}

export function getCardRoleChips(card: Card, commander?: Card): RoleChip[] {
  const profile = classifyCardRoles(card, commander);
  const chips: RoleChip[] = [];

  for (const role of profile.roles) {
    switch (role) {
      case 'mdfc_land':
        chips.push({ id: 'mdfc_land', label: 'MDFC Land', icon: '🏔️', style: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' });
        break;
      case 'utility_land':
        chips.push({ id: 'utility_land', label: 'Utility Land', icon: '🏔️', style: 'bg-teal-950/80 text-teal-300 border-teal-700/60' });
        break;
      case 'sac_outlet':
        chips.push({ id: 'sac_outlet', label: 'Sac Outlet', icon: '⚡', style: 'bg-amber-950/80 text-amber-300 border-amber-700/60' });
        break;
      case 'card_advantage':
        chips.push({ id: 'card_advantage', label: 'Card Draw', icon: '📖', style: 'bg-sky-950/80 text-sky-300 border-sky-700/60' });
        break;
      case 'removal':
        chips.push({ id: 'removal', label: 'Removal', icon: '🎯', style: 'bg-rose-950/80 text-rose-300 border-rose-700/60' });
        break;
      case 'board_wipe':
        chips.push({ id: 'board_wipe', label: 'Board Wipe', icon: '💣', style: 'bg-red-950/80 text-red-300 border-red-700/60' });
        break;
      case 'ramp':
        chips.push({ id: 'ramp', label: 'Ramp', icon: '💎', style: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' });
        break;
      case 'recursion':
        chips.push({ id: 'recursion', label: 'Recursion', icon: '💀', style: 'bg-purple-950/80 text-purple-300 border-purple-700/60' });
        break;
      case 'drain':
        chips.push({ id: 'drain', label: 'Drain', icon: '🩸', style: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-700/60' });
        break;
      case 'protection':
        chips.push({ id: 'protection', label: 'Protection', icon: '🛡️', style: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' });
        break;
      case 'tutor':
        chips.push({ id: 'tutor', label: 'Tutor', icon: '🔍', style: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' });
        break;
      case 'graveyard_hate':
        chips.push({ id: 'graveyard_hate', label: 'GY Hate', icon: '⚰️', style: 'bg-stone-900/90 text-stone-300 border-stone-600/70' });
        break;
      case 'threats':
        chips.push({ id: 'threats', label: 'Threat', icon: '⚔️', style: 'bg-amber-950/80 text-amber-300 border-amber-700/60' });
        break;
      case 'sideboard':
        chips.push({ id: 'sideboard', label: 'Sideboard', icon: '🗃️', style: 'bg-purple-950/80 text-purple-300 border-purple-700/60' });
        break;
    }
  }

  return chips;
}

/**
 * Curated registry of known MTG Arena Brawl matchmaking weights & WotC Commander Game Changers.
 * Grounded in community reverse-engineering of MTG Arena's internal deck-weight algorithm
 * and Wizards of the Coast's official 2025 Commander Bracket System.
 */

export interface CardWeightInfo {
  name: string;
  weight: number;
  isGameChanger?: boolean;
  category?: 'fast_mana' | 'tutor' | 'free_interaction' | 'game_warper' | 'combo_piece' | 'premium_removal';
  reason?: string;
}

/**
 * Top-tier "Hell-Queue" commanders on MTG Arena.
 * Running any of these automatically gives the deck ~1,800+ base matchmaking weight,
 * placing them squarely in the competitive queue against other top-tier decks.
 */
export const HELL_QUEUE_COMMANDERS = new Set<string>([
  'Kinnan, Bonder Prodigy',
  'Golos, Tireless Pilgrim',
  'Rusko, Clockmaker',
  'Atraxa, Grand Unifier',
  'Atraxa, Praetors\' Voice',
  'Ragavan, Nimble Pilferer',
  'Nadu, Winged Wisdom',
  'Poq, Villageless',
  'Teferi, Hero of Dominaria',
  'Baral, Chief of Compliance',
  'Nicol Bolas, Dragon-God',
  'Niv-Mizzet Reborn',
  'Roxanne, Starfall Savant',
  'Grenzo, Crooked Jailer',
  'Crucias, Titan of the Waves',
  'Jodah, the Unifier',
  'Winota, Joiner of Forces',
  'Sythis, Harvest\'s Hand',
  'Malcolm, Alluring Scoundrel',
  'Esika, God of the Tree',
  'Omnath, Locus of Creation',
  'Korvold, Fae-Cursed King',
  'Chulane, Teller of Tales',
  'Urza, Lord High Artificer',
  'Etali, Primal Conqueror',
  'Heliod, Sun-Crowned',
  'Yawgmoth, Thran Physician',
  'Emry, Lurker of the Loch'
]);

/**
 * Curated list of WotC official "Game Changers" and high-weight staples on MTG Arena.
 * Including multiple of these in the 99 rapidly escalates a deck's matchmaking bracket.
 */
export const ARENA_CARD_WEIGHTS: Record<string, CardWeightInfo> = {
  // S-Tier Game Warpers (500 pts)
  'The One Ring': {
    name: 'The One Ring',
    weight: 500,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Format-warping card advantage and protection engine.'
  },
  'Orcish Bowmasters': {
    name: 'Orcish Bowmasters',
    weight: 450,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Instant-speed draw punisher and board control.'
  },
  'Mana Drain': {
    name: 'Mana Drain',
    weight: 450,
    isGameChanger: true,
    category: 'free_interaction',
    reason: 'Hard counterspell that rituals for mana next turn.'
  },
  'Demonic Tutor': {
    name: 'Demonic Tutor',
    weight: 450,
    isGameChanger: true,
    category: 'tutor',
    reason: '2-mana unconditional tutor to hand.'
  },
  'Swords to Plowshares': {
    name: 'Swords to Plowshares',
    weight: 400,
    isGameChanger: true,
    category: 'premium_removal',
    reason: '1-mana unconditional exile removal.'
  },
  'Dark Ritual': {
    name: 'Dark Ritual',
    weight: 400,
    isGameChanger: true,
    category: 'fast_mana',
    reason: 'Turn 1 fast mana burst for early explosive plays.'
  },
  'Rhystic Study': {
    name: 'Rhystic Study',
    weight: 400,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Continuous tax and mass card draw engine.'
  },
  'Smothering Tithe': {
    name: 'Smothering Tithe',
    weight: 400,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Generates insurmountable Treasure advantage on draw steps.'
  },
  'Thassa\'s Oracle': {
    name: 'Thassa\'s Oracle',
    weight: 450,
    isGameChanger: true,
    category: 'combo_piece',
    reason: 'Premier compact 2-card win condition with Tainted Pact.'
  },
  'Tainted Pact': {
    name: 'Tainted Pact',
    weight: 400,
    isGameChanger: true,
    category: 'combo_piece',
    reason: 'Instant win combo enabler with Thassa\'s Oracle.'
  },
  'Wash Away': {
    name: 'Wash Away',
    weight: 350,
    isGameChanger: true,
    category: 'free_interaction',
    reason: '1-mana hard counter against commanders from the command zone.'
  },
  'Counterspell': {
    name: 'Counterspell',
    weight: 350,
    isGameChanger: false,
    category: 'free_interaction',
    reason: '2-mana unconditional hard counter.'
  },
  'Fierce Guardianship': {
    name: 'Fierce Guardianship',
    weight: 400,
    isGameChanger: true,
    category: 'free_interaction',
    reason: 'Free counterspell with commander on board.'
  },
  'Esper Sentinel': {
    name: 'Esper Sentinel',
    weight: 350,
    isGameChanger: true,
    category: 'game_warper',
    reason: '1-mana repeatable spell tax and card advantage.'
  },
  'Chrome Mox': {
    name: 'Chrome Mox',
    weight: 450,
    isGameChanger: true,
    category: 'fast_mana',
    reason: '0-mana permanent ramp rock.'
  },
  'Cyclonic Rift': {
    name: 'Cyclonic Rift',
    weight: 350,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Instant-speed one-sided mass board wipe.'
  },
  'Primeval Titan': {
    name: 'Primeval Titan',
    weight: 350,
    isGameChanger: false,
    category: 'game_warper',
    reason: 'Fetches Field of the Dead and ramp on entry and attack.'
  },
  'Field of the Dead': {
    name: 'Field of the Dead',
    weight: 350,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Uncounterable recurring zombie army from lands.'
  },
  'Minsc & Boo, Timeless Heroes': {
    name: 'Minsc & Boo, Timeless Heroes',
    weight: 400,
    isGameChanger: true,
    category: 'game_warper',
    reason: 'Devastating fast combat pressure and card draw fling.'
  },
  'Displacer Kitten': {
    name: 'Displacer Kitten',
    weight: 350,
    isGameChanger: false,
    category: 'combo_piece',
    reason: 'Enables infinite blink loops with planeswalkers and mana rocks.'
  },
  'Underworld Breach': {
    name: 'Underworld Breach',
    weight: 400,
    isGameChanger: true,
    category: 'combo_piece',
    reason: 'Premier storm and infinite graveyard recast engine.'
  },
  'Thoughtseize': {
    name: 'Thoughtseize',
    weight: 350,
    isGameChanger: false,
    category: 'premium_removal',
    reason: '1-mana targeted discard disrupting early curves.'
  },
  'Inquisition of Kozilek': {
    name: 'Inquisition of Kozilek',
    weight: 300,
    isGameChanger: false,
    category: 'premium_removal',
    reason: '1-mana targeted early discard.'
  },
  'Lightning Bolt': {
    name: 'Lightning Bolt',
    weight: 300,
    isGameChanger: false,
    category: 'premium_removal',
    reason: '1-mana 3 damage universal removal.'
  },
  'Spell Pierce': {
    name: 'Spell Pierce',
    weight: 250,
    isGameChanger: false,
    category: 'free_interaction',
    reason: '1-mana interaction catching early ramp and planeswalkers.'
  },
  'Cut Down': {
    name: 'Cut Down',
    weight: 250,
    isGameChanger: false,
    category: 'premium_removal',
    reason: '1-mana instant removal for early threats.'
  },
  'Fatal Push': {
    name: 'Fatal Push',
    weight: 300,
    isGameChanger: false,
    category: 'premium_removal',
    reason: '1-mana instant removal scaling with revolt.'
  },
  'Toxic Deluge': {
    name: 'Toxic Deluge',
    weight: 350,
    isGameChanger: true,
    category: 'premium_removal',
    reason: '3-mana board wipe bypassing indestructible.'
  },
  'Vampiric Tutor': {
    name: 'Vampiric Tutor',
    weight: 450,
    isGameChanger: true,
    category: 'tutor',
    reason: '1-mana instant tutor to top of library.'
  },
  'Green Sun\'s Zenith': {
    name: 'Green Sun\'s Zenith',
    weight: 300,
    isGameChanger: false,
    category: 'tutor',
    reason: 'Scalable creature tutor straight to battlefield.'
  }
};

/**
 * Checks if a commander is on MTG Arena's Hell-Queue list.
 */
export function isHellQueueCommander(commanderName?: string): boolean {
  if (!commanderName) return false;
  return HELL_QUEUE_COMMANDERS.has(commanderName.trim());
}

/**
 * Looks up known card weight information by name.
 */
export function getCardWeightInfo(cardName: string): CardWeightInfo | undefined {
  if (!cardName) return undefined;
  const direct = ARENA_CARD_WEIGHTS[cardName.trim()];
  if (direct) return direct;

  // Normalized search
  const clean = cardName.trim().toLowerCase();
  for (const [key, info] of Object.entries(ARENA_CARD_WEIGHTS)) {
    if (key.toLowerCase() === clean) {
      return info;
    }
  }
  return undefined;
}

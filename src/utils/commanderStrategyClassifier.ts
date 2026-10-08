import { Card } from '../types/card';

export type CommanderStrategyId =
  | 'aggro'
  | 'aristocrats'
  | 'graveyard'
  | 'lifegain'
  | 'spellslinger'
  | 'mill'
  | 'landfall'
  | 'tokens'
  | 'blink'
  | 'superfriends'
  | 'artifacts'
  | 'enchantments'
  | 'tribal';

export interface CommanderStrategyMeta {
  id: CommanderStrategyId;
  label: string;
  icon: string;
  description: string;
  scryfallQuery: string;
  gradient: string;
  borderClass: string;
}

export const COMMANDER_STRATEGIES: CommanderStrategyMeta[] = [
  {
    id: 'aggro',
    label: 'Aggro & Combat',
    icon: '⚔️',
    description: 'Extra combats, haste, double strike, attack triggers, and fast damage',
    scryfallQuery: '(o:"extra combat" or o:haste or o:"double strike" or o:"whenever ~ attacks" or o:"attacking creatures" or o:"combat damage to a player")',
    gradient: 'from-red-500/20 to-orange-500/20',
    borderClass: 'border-red-500/40 text-red-300'
  },
  {
    id: 'aristocrats',
    label: 'Sacrifice & Aristocrats',
    icon: '🩸',
    description: 'Creature death triggers, sacrifice outlets, and life drain effects',
    scryfallQuery: '(o:"creature dies" or o:"sacrifice a creature" or o:"whenever you sacrifice" or o:"creatures you control die" or o:"each opponent loses")',
    gradient: 'from-rose-950/40 to-red-900/30',
    borderClass: 'border-rose-500/40 text-rose-300'
  },
  {
    id: 'graveyard',
    label: 'Graveyard & Reanimator',
    icon: '💀',
    description: 'Cheating creatures from the graveyard, self-mill, delve, and recursion',
    scryfallQuery: '(o:"return" o:"from your graveyard" or o:"cast" o:"from your graveyard" or o:reanimate or o:undergrowth or o:dredge or o:flashback)',
    gradient: 'from-purple-950/40 to-slate-900/40',
    borderClass: 'border-purple-500/40 text-purple-300'
  },
  {
    id: 'lifegain',
    label: 'Lifegain & Vampires',
    icon: '💖',
    description: 'Life total acceleration, lifelink synergy, and life-gain triggers',
    scryfallQuery: '((o:"gain life" or o:"whenever you gain life" or o:lifelink or o:extort) and -o:"lose life, you gain that much")',
    gradient: 'from-emerald-950/40 to-teal-900/30',
    borderClass: 'border-emerald-500/40 text-emerald-300'
  },
  {
    id: 'spellslinger',
    label: 'Spellslinger & Burn',
    icon: '🌀',
    description: 'Instant and sorcery casting triggers, spell copying, prowess, and magecraft',
    scryfallQuery: '(o:"cast an instant or sorcery" or o:"instant and sorcery" or o:magecraft or o:prowess or o:"copy target instant" or o:"copy target spell")',
    gradient: 'from-blue-950/40 to-red-950/40',
    borderClass: 'border-blue-500/40 text-blue-300'
  },
  {
    id: 'mill',
    label: 'Mill & Discard',
    icon: '📜',
    description: 'Depleting enemy libraries, forcing discards, and stealing milled assets',
    scryfallQuery: '(o:"mills" or o:"cards from the top of their library into their graveyard" or o:"each opponent discards" or o:"target player discards")',
    gradient: 'from-indigo-950/40 to-slate-900/40',
    borderClass: 'border-indigo-500/40 text-indigo-300'
  },
  {
    id: 'landfall',
    label: 'Ramp & Landfall',
    icon: '💎',
    description: 'Landfall triggers, additional land drops, and big mana ramp engines',
    scryfallQuery: '(o:landfall or o:"play additional lands" or o:"land enters the battlefield under your control" or o:"search your library for a land card")',
    gradient: 'from-green-950/40 to-emerald-900/30',
    borderClass: 'border-green-500/40 text-green-300'
  },
  {
    id: 'tokens',
    label: 'Tokens & Go-Wide',
    icon: '🛡️',
    description: 'Swarming the board with creature tokens, populate, and convoke',
    scryfallQuery: '(o:"create" o:"token" or o:populate or o:convoke or o:"twice that many of those tokens")',
    gradient: 'from-amber-950/40 to-yellow-900/30',
    borderClass: 'border-amber-500/40 text-amber-300'
  },
  {
    id: 'blink',
    label: 'Blink & Enter Battlefield',
    icon: '🔄',
    description: 'Flickering permanents to repeatedly re-trigger ETB effects',
    scryfallQuery: '(o:"exile" o:"return it to the battlefield" or o:"exile another target creature" or o:"when ~ enters the battlefield" or o:"when ~ enters")',
    gradient: 'from-sky-950/40 to-cyan-900/30',
    borderClass: 'border-sky-500/40 text-sky-300'
  },
  {
    id: 'superfriends',
    label: 'Superfriends',
    icon: '👑',
    description: 'Planeswalker loyalty synergy, proliferate, and emblems',
    scryfallQuery: '(t:planeswalker or o:"planeswalker" or o:"loyalty counters" or o:proliferate)',
    gradient: 'from-yellow-950/40 to-amber-900/30',
    borderClass: 'border-yellow-500/40 text-yellow-300'
  },
  {
    id: 'artifacts',
    label: 'Artifacts & Vehicles',
    icon: '⚙️',
    description: 'Artifact synergies, affinity, equipment, thopters, and vehicles',
    scryfallQuery: '(o:"artifact spells" or o:"control an artifact" or o:affinity or o:modular or o:crew or o:equipment or (t:artifact t:creature))',
    gradient: 'from-slate-800/40 to-zinc-900/40',
    borderClass: 'border-slate-400/40 text-slate-300'
  },
  {
    id: 'enchantments',
    label: 'Enchantress & Sagas',
    icon: '✨',
    description: 'Constellation triggers, sagas, auras, and enchantment-heavy boards',
    scryfallQuery: '(o:"enchantment spell" or o:constellation or o:sagas or (t:enchantment t:creature) or o:"enchanted creature")',
    gradient: 'from-pink-950/40 to-purple-900/30',
    borderClass: 'border-pink-500/40 text-pink-300'
  },
  {
    id: 'tribal',
    label: 'Tribal / Kindred',
    icon: '🐉',
    description: 'Kindred deckbuilding (Dragons, Elves, Goblins, Vampires, Zombies, Angels, Merfolk)',
    scryfallQuery: '(o:"other dragon" or o:"other elf" or o:"other goblin" or o:"other vampire" or o:"other zombie" or o:"other angel" or o:"other merfolk" or o:"other dinosaur" or o:"creature type")',
    gradient: 'from-orange-950/40 to-amber-900/30',
    borderClass: 'border-orange-500/40 text-orange-300'
  }
];

/**
 * Classifies a commander card into one or more strategy archetypes by inspecting rules text and types.
 */
export function classifyCommanderStrategies(card: Card): CommanderStrategyMeta[] {
  const o = (card.oracleText || '').toLowerCase();
  const typeLine = (card.typeLine || '').toLowerCase();
  const name = card.name.toLowerCase();

  const matchedIds = new Set<CommanderStrategyId>();

  // 1. Aggro & Combat
  if (
    o.includes('extra combat') ||
    o.includes('haste') ||
    o.includes('double strike') ||
    o.includes('whenever this creature attacks') ||
    o.includes('whenever you attack') ||
    o.includes('combat damage to a player') ||
    o.includes('modified creatures') ||
    o.includes('equipment')
  ) {
    matchedIds.add('aggro');
  }

  // 2. Aristocrats & Sacrifice
  if (
    o.includes('creature dies') ||
    o.includes('sacrifice a creature') ||
    o.includes('whenever you sacrifice') ||
    o.includes('each opponent loses 1 life and you gain 1 life') ||
    o.includes('each opponent loses life') ||
    name.includes('korvold') ||
    name.includes('elenda') ||
    name.includes('teysa') ||
    name.includes('slimefoot') ||
    name.includes('wilhelt') ||
    name.includes('braids')
  ) {
    matchedIds.add('aristocrats');
  }

  // 3. Graveyard & Recursion
  if (
    o.includes('from your graveyard') ||
    o.includes('from a graveyard') ||
    o.includes('cast spells from your graveyard') ||
    o.includes('return target creature card from your graveyard') ||
    o.includes('flashback') ||
    o.includes('unearth') ||
    o.includes('reanimate') ||
    o.includes('delve') ||
    name.includes('muldrotha') ||
    name.includes('scarab god') ||
    name.includes('meren') ||
    name.includes('karador')
  ) {
    matchedIds.add('graveyard');
  }

  // 4. Lifegain
  if (
    o.includes('whenever you gain life') ||
    o.includes('gain life') ||
    o.includes('lifelink') ||
    o.includes('extort') ||
    name.includes('heiod') ||
    name.includes('dina') ||
    name.includes('amalia') ||
    name.includes('lathiel') ||
    name.includes('trelasarra')
  ) {
    matchedIds.add('lifegain');
  }

  // 5. Spellslinger
  if (
    o.includes('cast an instant or sorcery') ||
    o.includes('instant and sorcery') ||
    o.includes('magecraft') ||
    o.includes('prowess') ||
    o.includes('copy target instant') ||
    o.includes('copy target spell') ||
    name.includes('stella lee') ||
    name.includes('niv-mizzet') ||
    name.includes('baral') ||
    name.includes('veyran') ||
    name.includes('kess')
  ) {
    matchedIds.add('spellslinger');
  }

  // 6. Mill & Discard
  if (
    o.includes('mill') ||
    o.includes('cards from the top of their library') ||
    o.includes('each opponent discards') ||
    o.includes('target player discards') ||
    name.includes('bruvac') ||
    name.includes("n'ghathrod") ||
    name.includes('kroxa') ||
    name.includes('tinybones')
  ) {
    matchedIds.add('mill');
  }

  // 7. Landfall & Ramp
  if (
    o.includes('landfall') ||
    o.includes('play additional lands') ||
    o.includes('land enters the battlefield') ||
    o.includes('search your library for a land') ||
    name.includes('omnath') ||
    name.includes('tatyova') ||
    name.includes('azusa') ||
    name.includes('gitrog') ||
    name.includes('titania')
  ) {
    matchedIds.add('landfall');
  }

  // 8. Tokens & Go-Wide
  if (
    o.includes('create a') && o.includes('token') ||
    o.includes('create two') ||
    o.includes('create three') ||
    o.includes('populate') ||
    o.includes('convoke') ||
    name.includes('krenko') ||
    name.includes('cadira') ||
    name.includes('adeline') ||
    name.includes('chatterfang') ||
    name.includes('rhys')
  ) {
    matchedIds.add('tokens');
  }

  // 9. Blink
  if (
    (o.includes('exile') && o.includes('return it to the battlefield')) ||
    (o.includes('exile') && o.includes('return that card to the battlefield')) ||
    name.includes('yorion') ||
    name.includes('thassa, deep-dwelling') ||
    name.includes('brago') ||
    name.includes('emiel') ||
    name.includes('abuelo')
  ) {
    matchedIds.add('blink');
  }

  // 10. Superfriends
  if (
    card.types.includes('Planeswalker') ||
    typeLine.includes('planeswalker') ||
    o.includes('loyalty') ||
    o.includes('proliferate') ||
    name.includes('atraxa')
  ) {
    matchedIds.add('superfriends');
  }

  // 11. Artifacts
  if (
    card.types.includes('Artifact') ||
    o.includes('artifact spells') ||
    o.includes('artifacts you control') ||
    o.includes('affinity for artifacts') ||
    o.includes('vehicles') ||
    name.includes('urza') ||
    name.includes('emry') ||
    name.includes('osgir') ||
    name.includes('jhoira')
  ) {
    matchedIds.add('artifacts');
  }

  // 12. Enchantments
  if (
    card.types.includes('Enchantment') ||
    o.includes('enchantment spells') ||
    o.includes('enchantments you control') ||
    o.includes('constellation') ||
    o.includes('sagas') ||
    name.includes('sythis') ||
    name.includes('calix') ||
    name.includes('shrine') ||
    name.includes('zur')
  ) {
    matchedIds.add('enchantments');
  }

  // 13. Tribal
  const tribalKeywords = ['dragon', 'elf', 'goblin', 'vampire', 'zombie', 'angel', 'merfolk', 'dinosaur', 'sliver', 'knight', 'wizard'];
  for (const tribe of tribalKeywords) {
    if (o.includes(`other ${tribe}`) || o.includes(`${tribe} spells`) || o.includes(`each ${tribe}`) || (card.subtypes || []).some(s => s.toLowerCase() === tribe && o.includes('tribal'))) {
      matchedIds.add('tribal');
      break;
    }
  }

  return COMMANDER_STRATEGIES.filter(s => matchedIds.has(s.id));
}

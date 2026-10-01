import { Card } from '../types/card';

export interface CommanderTriggerConfig {
  hasTriggers: boolean;
  tabLabel: string;
  triggerType: 'sacrifice' | 'haste_untap' | 'cantrip' | 'lifegain' | 'exile_cast' | 'blink' | 'ring' | 'graveyard_fuel' | null;
  scryfallQuery?: string;
  isTriggerCard: (card: Card) => boolean;
  getCardReason: (commander: Card, card: Card) => string;
  getCardBadge: (card: Card) => string;
}

/**
 * Evaluates a commander card and discovers its primary mechanical catalyst or trigger requirements.
 * Returns dynamic trigger configuration used to populate the "🎯 Commander Triggers" tab.
 */
export function getCommanderTriggerConfig(commander?: Card): CommanderTriggerConfig {
  if (!commander) {
    return {
      hasTriggers: false,
      tabLabel: '',
      triggerType: null,
      isTriggerCard: () => false,
      getCardReason: () => '',
      getCardBadge: () => ''
    };
  }

  const o = (commander.oracleText || '').toLowerCase();
  const name = commander.name.toLowerCase();

  // 1. Sacrifice / Creature Death Trigger
  // e.g. Liliana, Heretical Healer, Teysa Karlov, Elenda, Korvold, Judith, Wilhelt, Slimefoot, Braids
  const isDeathTrigger = 
    o.includes('creature you control dies') ||
    o.includes('creature dies') ||
    o.includes('whenever you sacrifice') ||
    o.includes('sacrifice a creature') ||
    name.includes('liliana, heretical healer') ||
    name.includes('teysa karlov') ||
    name.includes('elenda');

  if (isDeathTrigger) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Triggers',
      triggerType: 'sacrifice',
      scryfallQuery: '(o:"sacrifice a creature" or o:"sacrifice another creature" or o:"additional cost to cast this spell, sacrifice" or o:"sacrifice an artifact or creature")',
      isTriggerCard: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        const cn = card.name.toLowerCase();
        const knownOutlets = [
          'deadly dispute', 'village rites', 'corrupted conviction', 'victimize',
          'ashnod\'s altar', 'phyrexian altar', 'altar of dementia', 'phyrexian tower',
          'viscera seer', 'woe strider', 'dockside chef', 'high market', 'plumb the forbidden',
          'eaten alive', 'severed strands', 'bartolomé del presidio', 'ayara, first of locthwain',
          'yawgmoth, thran physician', 'hostile hostel', 'diabolic intent', 'warren soultrader',
          'braids, arisen nightmare', 'carrion feeder', 'fell stinger', 'fanatical offering',
          'vampiric rites', 'priest of forgotten gods'
        ];
        if (knownOutlets.some(outlet => cn.includes(outlet))) return true;
        if (co.includes('sacrifice a creature:') || co.includes('sacrifice another creature:')) return true;
        if (co.includes('sacrifice a creature or') || co.includes('sacrifice an artifact or creature')) return true;
        if (co.includes('as an additional cost to cast this spell, sacrifice a creature')) return true;
        if (co.includes('as an additional cost to cast this spell, sacrifice an artifact or creature')) return true;
        if (co.includes('{t}, sacrifice a creature')) return true;
        return false;
      },
      getCardReason: (cmd: Card) => {
        if (cmd.name.toLowerCase().includes('liliana')) {
          return `Sacrifice Outlet: Immediately flips Liliana into Defiant Necromancer on command`;
        }
        return `Sacrifice Outlet: Actively triggers ${cmd.name}'s death payoffs on command`;
      },
      getCardBadge: () => `⚡ Sac Trigger`
    };
  }

  // 2. Spellslinger / Multi-Spell Trigger (PRIORITIZED BEFORE GENERIC TAP)
  // e.g. Stella Lee, Wild Card, Baral, Veyran, Niv-Mizzet, Kalamax
  const isSpellslinger = 
    o.includes('second spell') ||
    o.includes('three or more spells') ||
    o.includes('whenever you cast an instant or sorcery') ||
    o.includes('whenever you cast a noncreature spell') ||
    o.includes('whenever you cast or copy an instant') ||
    o.includes('spells you cast cost {1} less') ||
    o.includes('spells you cast cost {2} less');

  if (isSpellslinger) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Synergies',
      triggerType: 'cantrip',
      scryfallQuery: '(t:instant or t:sorcery) cmc<=2 (o:"draw a card" or o:"scry" or o:"deal" or o:"target" or o:"counter target")',
      isTriggerCard: (card: Card) => {
        const isSpell = card.types.includes('Instant') || card.types.includes('Sorcery');
        if (!isSpell) return false;
        return card.cmc <= 2;
      },
      getCardReason: (cmd: Card) => {
        return `Low-CMC Spell / Cantrip: Effortlessly triggers and chains ${cmd.name}'s multi-spell engine`;
      },
      getCardBadge: () => `⚡ Cheap Spell`
    };
  }

  // 3. Activated Tap Ability Commander (Haste & Untap)
  // e.g. Krenko, Mob Boss, Captain Sisay, Lathril, Emry, Prime Speaker Vannifar
  const hasTapAbility = (commander.oracleText || '').includes('{T}:') || (commander.oracleText || '').includes('{t}:');
  if (hasTapAbility) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Triggers',
      triggerType: 'haste_untap',
      scryfallQuery: '(o:haste or o:"untap target" or o:"untap this" or "Lightning Greaves" or "Swiftfoot Boots" or "Thousand-Year Elixir" or "Patriar\'s Seal" or "Sting, the Glinting Dagger")',
      isTriggerCard: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        const cn = card.name.toLowerCase();
        const hasteStaples = [
          'lightning greaves', 'swiftfoot boots', 'thousand-year elixir', 'patriar\'s seal',
          'sting, the glinting dagger', 'arena of glory', 'rising of the day', 'crashing drawbridge',
          'boots of speed', 'lavaspur boots', 'rabbit battery', 'bitter reunion', 'fervor',
          'tyvar, jubilant brawler', 'magewright\'s stone', 'samut, voice of dissent', 'hall of the bandit lord'
        ];
        if (hasteStaples.some(s => cn.includes(s))) return true;
        if (card.types.includes('Artifact') || card.types.includes('Enchantment') || card.types.includes('Land')) {
          if (co.includes('have haste') || co.includes('has haste') || co.includes('gains haste')) return true;
          if (co.includes('untap target') || co.includes('untap another target')) return true;
        }
        return false;
      },
      getCardReason: (cmd: Card) => {
        return `Haste & Untap: Lets ${cmd.name} tap immediately and multiple times per turn`;
      },
      getCardBadge: () => `⚡ Tap Enabler`
    };
  }

  // 4. Lifegain Trigger
  // e.g. Heliod, Sun-Crowned, Dina, Karlov, Trelasarra, Lathiel
  const isLifegain = o.includes('whenever you gain life') || o.includes('if you gained life');
  if (isLifegain) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Triggers',
      triggerType: 'lifegain',
      scryfallQuery: '(o:"gain 1 life" or o:"gains 1 life" or o:"lifelink" or o:"whenever another creature enters")',
      isTriggerCard: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        const cn = card.name.toLowerCase();
        const lifeCards = [
          'soul warden', 'soul\'s attendant', 'essence warden', 'authority of the consuls',
          'guide of souls', 'shadowspear', 'the gilded goose', 'daxos, blessed by the sun',
          'auriok champion', 'ajani\'s welcome', 'impassioned orator', 'lunarch veteran',
          'prosperous innkeeper', 'clerics class', 'blind obedience'
        ];
        if (lifeCards.some(s => cn.includes(s))) return true;
        if (co.includes('you gain 1 life') || co.includes('you gain life') || (co.includes('whenever a creature enters') && co.includes('gain'))) return true;
        return false;
      },
      getCardReason: (cmd: Card) => {
        return `Incidental Lifegain: Repeatedly procs ${cmd.name}'s lifegain payoff each turn`;
      },
      getCardBadge: () => `❤️ Life Trigger`
    };
  }

  // 5. Exile Cast Trigger (Impulse draw / Exile-matter payoff)
  // e.g. Prosper, Tome-Bound, Pia Nalaar, Consul of Revival, Rocco, Street Chef, The War Doctor
  const isExileCast = 
    /(whenever|if)\s+you\s+(cast|play)\s+.*from\s+exile/i.test(o) ||
    name.includes('prosper, tome-bound') ||
    name.includes('pia nalaar, consul of revival') ||
    name.includes('rocco, street chef');

  if (isExileCast) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Triggers',
      triggerType: 'exile_cast',
      scryfallQuery: '(o:"exile the top" o:"you may play") or (o:"exile the top" o:"you may cast")',
      isTriggerCard: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        const impulseCards = [
          'reckless impulse', 'wrenn\'s resolve', 'light up the stage', 'laelia, the blade reforged',
          'valakut exploration', 'professional face-breaker', 'robber of the rich', 'chandra, dressed to kill',
          'questing druid', 'bonecrusher giant', 'adventure'
        ];
        if (impulseCards.some(s => card.name.toLowerCase().includes(s))) return true;
        if (co.includes('exile the top') && (co.includes('you may play') || co.includes('you may cast'))) return true;
        return false;
      },
      getCardReason: (cmd: Card) => {
        const cmdLower = (cmd.oracleText || '').toLowerCase();
        if (cmdLower.includes('treasure')) {
          return `Plays from Exile: Casts from exile to trigger ${cmd.name} and create Treasures`;
        }
        if (cmdLower.includes('thopter') || cmdLower.includes('token')) {
          return `Plays from Exile: Casts from exile to trigger ${cmd.name} and generate creature tokens`;
        }
        return `Plays from Exile: Triggers ${cmd.name}'s cast-from-exile payoff ability`;
      },
      getCardBadge: () => `✨ Exile Enabler`
    };
  }

  // 6. Blink / ETB Trigger
  // e.g. Yorion, Sky Nomad, Brago, King Eternal, Abdel Adrian, Roon, Thassa Deep-Dwelling
  const isBlink = (
    (o.includes('exile') && (o.includes('return') || o.includes('until'))) &&
    (
      (o.includes('enters') && (o.includes('other nonland') || o.includes('permanents you own') || o.includes('permanents you control') || o.includes('creature you control'))) ||
      o.includes('exile target creature you control') ||
      o.includes('exile another target creature you control') ||
      o.includes('exile up to one other target creature you control') ||
      o.includes('exile any number of target nonland permanents you control') ||
      (o.includes('enters the battlefield') && o.includes('exile') && o.includes('return'))
    )
  );
  if (isBlink) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Triggers',
      triggerType: 'blink',
      scryfallQuery: '(o:"exile target" and (o:"return it to the battlefield" or o:"return that card to the battlefield"))',
      isTriggerCard: (card: Card) => {
        const blinkCards = [
          'ephemerate', 'touch the spirit realm', 'teleportation circle', 'displacer kitten',
          'charming prince', 'flickerwisp', 'golden argosy', 'scrollshift', 'justiciar\'s portal',
          'cloudshift', 'ghostly flicker', 'thassa, deep-dwelling', 'soulherder', 'conjurer\'s closet',
          'abdel adrian', 'brago, king eternal', 'yorion, sky nomad', 'restoration angel'
        ];
        if (blinkCards.some(s => card.name.toLowerCase().includes(s))) return true;
        const co = (card.oracleText || '').toLowerCase();
        return (co.includes('exile target') || co.includes('exile another target') || co.includes('exile up to one')) && 
          (co.includes('return it to the battlefield') || co.includes('return that card to the battlefield') || co.includes('return those cards'));
      },
      getCardReason: (cmd: Card) => {
        return `Blink Enabler: Re-triggers ${cmd.name}'s enters-the-battlefield ability repeatedly`;
      },
      getCardBadge: () => `🌀 Blink Enabler`
    };
  }

  // 7. Graveyard Fuel & Reanimation Catalyst
  // e.g. Sauron, the Necromancer, Meren, Muldrotha, Chainer, Araumi, Karador, Feldon, Gisa and Geralf, Syr Konrad
  const isGraveyardEngine = 
    o.includes('creature card from your graveyard') ||
    o.includes('creature card in your graveyard') ||
    o.includes('creature spell from your graveyard') ||
    o.includes('permanent card from your graveyard') ||
    o.includes('creature card is put into a graveyard') ||
    o.includes('creature card leaves your graveyard') ||
    (o.includes('from your graveyard') && (o.includes('exile') || o.includes('return') || o.includes('cast')));

  if (isGraveyardEngine) {
    const hasRingSynergy = o.includes('ring-bearer') || o.includes('the ring tempts you');
    return {
      hasTriggers: true,
      tabLabel: 'Commander Synergies',
      triggerType: 'graveyard_fuel',
      scryfallQuery: hasRingSynergy
        ? '(o:mill or o:"discard a card" or o:"discards a card" or o:surveil or o:"into your graveyard" or o:"the ring tempts you")'
        : '(o:mill or o:"discard a card" or o:"discards a card" or o:surveil or o:"into your graveyard" or o:entomb)',
      isTriggerCard: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        const cn = card.name.toLowerCase();
        const staples = [
          'stitcher\'s supplier', 'undead butler', 'mire triton', 'bitter triumph',
          'collective brutality', 'bone shards', 'vile entomber', 'buried alive',
          'entomb', 'unmarked grave', 'altar of dementia', 'palantír of orthanc',
          'ransack the lab', 'rankle, master of pranks', 'key to the city',
          'faithless looting', 'tainted indulgence', 'cathartic reunion',
          'thrill of possibility', 'tormenting voice', 'demand answers', 'big score',
          'call of the ring', 'inherited envelope', 'nazgûl', 'ringwraiths'
        ];
        if (staples.some(s => cn.includes(s))) return true;
        if (co.includes('discard a card') || co.includes('discards a card') || co.includes('discard one or more') || co.includes('as an additional cost to cast this spell, discard')) return true;
        if (co.includes('mill ') || co.includes('mills ') || co.includes('surveil ')) return true;
        if (co.includes('put') && co.includes('into your graveyard')) return true;
        if (hasRingSynergy && co.includes('the ring tempts you')) return true;
        return false;
      },
      getCardReason: (cmd: Card, card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        if (co.includes('the ring tempts you')) {
          return `Ring-bearer Catalyst: Designates Ring-bearer to make ${cmd.name}'s Wraith copies permanent`;
        }
        if (co.includes('discard') || /additional cost.*discard/i.test(co)) {
          return `Discard Outlet: Dumps reanimation targets from your hand directly into your graveyard for ${cmd.name}`;
        }
        if (co.includes('mill') || co.includes('surveil') || co.includes('into your graveyard')) {
          return `Graveyard Fuel: Mills/tutors creature targets directly into your graveyard for ${cmd.name}`;
        }
        return `Graveyard Catalyst: Fuels ${cmd.name}'s graveyard requirements`;
      },
      getCardBadge: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        if (co.includes('the ring tempts you')) return `💍 Ring Enabler`;
        if (co.includes('discard') || /additional cost.*discard/i.test(co)) return `⚡ Discard Outlet`;
        if (co.includes('mill') || co.includes('surveil')) return `⚰️ GY Fuel`;
        if (co.includes('into your graveyard')) return `🔍 Entomb Fuel`;
        return `⚡ GY Catalyst`;
      }
    };
  }

  // 8. The Ring Tempts You / Ring-bearer Trigger
  // e.g. Frodo, Sauron's Bane, Samwise the Stouthearted
  const isRingCommander = o.includes('ring-bearer') || o.includes('the ring tempts you');
  if (isRingCommander) {
    return {
      hasTriggers: true,
      tabLabel: 'Commander Synergies',
      triggerType: 'ring',
      scryfallQuery: 'o:"the ring tempts you"',
      isTriggerCard: (card: Card) => {
        const co = (card.oracleText || '').toLowerCase();
        return co.includes('the ring tempts you');
      },
      getCardReason: (cmd: Card) => {
        return `Ring-bearer Catalyst: Designates Ring-bearer to activate ${cmd.name}'s abilities`;
      },
      getCardBadge: () => `💍 Ring Enabler`
    };
  }

  // Default: No specific trigger requirement
  return {
    hasTriggers: false,
    tabLabel: '',
    triggerType: null,
    isTriggerCard: () => false,
    getCardReason: () => '',
    getCardBadge: () => ''
  };
}

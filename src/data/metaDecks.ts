import { Deck } from '../types/deck';
import { ARENA_CARDS } from './arenaCards';

const getCard = (id: string) => {
  const card = ARENA_CARDS.find(c => c.id === id);
  if (!card) throw new Error(`Card not found: ${id}`);
  return card;
};

export const META_DECKS: Deck[] = [
  {
    id: "timeless-boros-energy",
    name: "Timeless Boros Energy",
    format: "timeless",
    description: "The premier tier 1 aggro-midrange powerhouse in Timeless utilizing Guide of Souls, Ocelot Pride, Phlage, and Lightning Bolt.",
    tags: ["Tier 1", "Aggro", "Energy", "Timeless"],
    createdAt: "2026-09-20",
    updatedAt: "2026-09-27",
    mainboard: [
      { card: getCard("guide-of-souls"), quantity: 4 },
      { card: getCard("ocelot-pride"), quantity: 4 },
      { card: getCard("ragavan-nimble-pilferer"), quantity: 4 },
      { card: getCard("amped-raptor"), quantity: 4 },
      { card: getCard("phlage-titan-of-fires-fury"), quantity: 4 },
      { card: getCard("lightning-bolt"), quantity: 4 },
      { card: getCard("swords-to-plowshares"), quantity: 4 },
      { card: getCard("fable-of-the-mirror-breaker"), quantity: 2 },
      { card: getCard("flooded-strand"), quantity: 4 },
      { card: getCard("wooded-foothills"), quantity: 4 },
      { card: getCard("windswept-heath"), quantity: 4 },
      { card: getCard("sacred-foundry"), quantity: 4 },
      { card: getCard("plains"), quantity: 2 },
      { card: getCard("mountain"), quantity: 2 }
    ],
    sideboard: [
      { card: getCard("the-one-ring"), quantity: 2 },
      { card: getCard("fatal-push"), quantity: 3 }
    ]
  },
  {
    id: "timeless-show-and-tell",
    name: "Timeless Sneak & Show",
    format: "timeless",
    description: "Cheat Atraxa, Grand Unifier or Omniscience into play on turn 2 or 3 using Dark Ritual, Show and Tell, and Sneak Attack.",
    tags: ["Combo", "Tier 1", "Timeless"],
    createdAt: "2026-09-22",
    updatedAt: "2026-09-27",
    mainboard: [
      { card: getCard("show-and-tell"), quantity: 4 },
      { card: getCard("sneak-attack"), quantity: 3 },
      { card: getCard("atraxa-grand-unifier"), quantity: 4 },
      { card: getCard("omniscience"), quantity: 3 },
      { card: getCard("brainstorm"), quantity: 4 },
      { card: getCard("dark-ritual"), quantity: 4 },
      { card: getCard("thoughtseize"), quantity: 4 },
      { card: getCard("counterspell"), quantity: 2 },
      { card: getCard("polluted-delta"), quantity: 4 },
      { card: getCard("flooded-strand"), quantity: 4 },
      { card: getCard("watery-grave"), quantity: 4 },
      { card: getCard("steam-vents"), quantity: 2 },
      { card: getCard("blood-crypt"), quantity: 2 },
      { card: getCard("island"), quantity: 2 },
      { card: getCard("swamp"), quantity: 2 }
    ],
    sideboard: [
      { card: getCard("orcish-bowmasters"), quantity: 4 },
      { card: getCard("fatal-push"), quantity: 2 }
    ]
  },
  {
    id: "alchemy-spellbook-control",
    name: "Alchemy Power 9 Control",
    format: "alchemy",
    description: "Leverages Oracle of the Alpha to conjure the Power Nine and Key to the Archive to draft game-breaking spells.",
    tags: ["Control", "Alchemy", "Digital"],
    createdAt: "2026-09-25",
    updatedAt: "2026-09-27",
    mainboard: [
      { card: getCard("oracle-of-the-alpha"), quantity: 4 },
      { card: getCard("key-to-the-archive"), quantity: 3 },
      { card: getCard("crucias-titan-of-waves"), quantity: 3 },
      { card: getCard("sheoldred-the-apocalypse"), quantity: 3 },
      { card: getCard("cut-down"), quantity: 3 },
      { card: getCard("go-for-the-throat"), quantity: 3 },
      { card: getCard("deep-cavern-bat"), quantity: 4 },
      { card: getCard("sunfall"), quantity: 2 },
      { card: getCard("watery-grave"), quantity: 4 },
      { card: getCard("steam-vents"), quantity: 4 },
      { card: getCard("blood-crypt"), quantity: 4 },
      { card: getCard("island"), quantity: 3 },
      { card: getCard("swamp"), quantity: 3 }
    ],
    sideboard: []
  },
  {
    id: "standard-gruul-prowess",
    name: "Standard Gruul Prowess",
    format: "standard",
    description: "Blistering aggro deck fueled by Heartfire Hero, Slickshot Show-Off, and Monstrous Rage.",
    tags: ["Aggro", "Standard", "Tier 1"],
    createdAt: "2026-09-26",
    updatedAt: "2026-09-27",
    mainboard: [
      { card: getCard("heartfire-hero"), quantity: 4 },
      { card: getCard("slickshot-show-off"), quantity: 4 },
      { card: getCard("monastery-swiftspear"), quantity: 4 },
      { card: getCard("monstrous-rage"), quantity: 4 },
      { card: getCard("boseiju-who-endures"), quantity: 2 },
      { card: getCard("mountain"), quantity: 12 },
      { card: getCard("forest"), quantity: 6 }
    ],
    sideboard: []
  }
];

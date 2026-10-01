# DieToRemoval (dietoremoval.gg) — MTG Arena Hub & Deckbuilder

An Arena-native Magic: The Gathering deckbuilder, causal synergy engine, and collection hub. Built specifically to eliminate the friction that MTG Arena players face when using paper-centric tools.

---

## 🎯 The Core Problems This Solves

1. **Zero Paper-Card Pollution**: Only cards physically available and programmed into MTG Arena are indexed and recommended.
2. **Wildcard Economy Instead of Dollar Pricing**: Replaces secondary market USD/EUR prices with real-time **Common, Uncommon, Rare, and Mythic Wildcard crafting requirements**.
3. **Arena Collection Syncing via `Player.log`**: Drag-and-drop or paste MTG Arena's `Player.log` to immediately identify which cards you own and calculate true missing wildcard deficiencies.
4. **Digital & Alchemy Mechanics First-Class Support**: Interactive inspectors for **Spellbooks** (e.g., *Key to the Archive*, *Oracle of the Alpha* Power 9), **Conjure**, **Seek**, and **Perpetual** effects.
5. **Strict MTG Arena Export/Import**: 1-click clipboard formatting that uses verified Arena set codes and collector numbers so the MTG Arena client never rejects imports.

---

## 🚀 Key Features

* **Instant Card Explorer**: Fast search by name, rules text, or type, with strict format legality filters (*Standard, Timeless, Historic, Explorer / Pioneer, Brawl, Alchemy*), color identity, card type, and digital-only toggles.
* **Workspace & Grouping**: Group cards by Creatures, Instants/Sorceries, Artifacts/Enchantments, Planeswalkers, Lands, and Sideboard.
* **Deck Analytics**: Live mana curve histogram, color pip ratios vs land mana sources, average converted mana cost, and card type distributions.
* **Goldfish & Hand Simulator**: Full London Mulligan simulation engine and draw-step testing.
* **Tier 1 Meta Decks**: Preloaded tournament archetypes (Timeless Boros Energy, Sneak & Show, Alchemy Power 9 Control, Standard Gruul Prowess) ready to test against your collection.

---

## 🛠️ Getting Started

### Prerequisites
* Node.js (v18+)
* npm

### Running the App Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🏗️ Architecture & Extensibility

* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4.
* **Deck & Card Engine**: Strict data contracts (`Card`, `Deck`, `DeckWildcardCost`) with normalized MTG Arena IDs.
* **Data Ingestion**: Ready to stream Scryfall's bulk data `Default Cards` endpoint filtered by `"arena" in games`.

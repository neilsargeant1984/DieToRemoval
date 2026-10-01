import React, { useState, useEffect, useMemo } from 'react';
import { Card, FormatType } from './types/card';
import { Deck } from './types/deck';
import { UserCollection, WildcardInventory } from './types/collection';
import { ArenaNavbar, MainNavTab } from './components/ArenaNavbar';
import { BrawlCommandZone, BrawlSubMode } from './components/BrawlCommandZone';
import { BrawlSynergyConsole, SynergyCategoryTab } from './components/BrawlSynergyConsole';
import { DeckDrawer } from './components/DeckDrawer';
import { CardLibraryView } from './components/CardLibraryView';
import { CardSearchPanel } from './components/CardSearchPanel';
import { DeckListWorkspace } from './components/DeckListWorkspace';
import { CardDetailModal } from './components/CardDetailModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { GoldfishModal } from './components/GoldfishModal';
import { CollectionSyncModal } from './components/CollectionSyncModal';
import { MetaDecksModal } from './components/MetaDecksModal';
import { ExportImportModal } from './components/ExportImportModal';
import { CommanderPickerModal } from './components/CommanderPickerModal';
import { MyDecksView } from './components/MyDecksView';
import { calculateDeckWildcards } from './utils/wildcardCalculator';
import { calculateDeckStats } from './utils/deckAnalytics';
import { ARENA_CARDS } from './data/arenaCards';

export const App: React.FC = () => {
  // Navigation State
  const [navTab, setNavTab] = useState<MainNavTab>('deck_builder');
  const [brawlSubMode, setBrawlSubMode] = useState<BrawlSubMode>('brawl_historic');
  const [synergyTab, setSynergyTab] = useState<SynergyCategoryTab>('creatures');
  const [isDeckDrawerOpen, setIsDeckDrawerOpen] = useState(false);

  // Saved Decks Collection (All user-created decks)
  const [savedDecks, setSavedDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('arenaforge_saved_decks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    // Default initial deck
    const defaultCommander = ARENA_CARDS.find(c => c.name.includes('Liliana')) || ARENA_CARDS[0];
    return [{
      id: 'default-brawl-deck',
      name: `${defaultCommander.name} Brawl`,
      format: 'brawl',
      commander: { card: defaultCommander, quantity: 1 },
      mainboard: [],
      sideboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
  });

  // Active Deck State (The deck currently loaded into the workspace)
  const [activeDeck, setActiveDeck] = useState<Deck>(() => {
    const saved = localStorage.getItem('arenaforge_active_deck');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    const defaultCommander = ARENA_CARDS.find(c => c.name.includes('Liliana')) || ARENA_CARDS[0];
    return {
      id: 'default-brawl-deck',
      name: `${defaultCommander.name} Brawl`,
      format: 'brawl',
      commander: { card: defaultCommander, quantity: 1 },
      mainboard: [],
      sideboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // User Wildcard Inventory
  const [wildcardInventory, setWildcardInventory] = useState<WildcardInventory>(() => {
    const saved = localStorage.getItem('arenaforge_wildcard_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return { common: 35, uncommon: 42, rare: 12, mythic: 5 };
  });

  // User Card Collection (arenaId -> count owned)
  const [userCollection, setUserCollection] = useState<UserCollection>(() => {
    const saved = localStorage.getItem('arenaforge_user_collection');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {};
  });

  // Modals
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isGoldfishOpen, setIsGoldfishOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isCommanderPickerOpen, setIsCommanderPickerOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import' | null>(null);
  const [selectedCardDetail, setSelectedCardDetail] = useState<Card | null>(null);

  // Sync activeDeck changes back to savedDecks collection
  useEffect(() => {
    localStorage.setItem('arenaforge_active_deck', JSON.stringify(activeDeck));
    setSavedDecks(prev => {
      const idx = prev.findIndex(d => d.id === activeDeck.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = activeDeck;
        return next;
      } else {
        return [activeDeck, ...prev];
      }
    });
  }, [activeDeck]);

  // Persist savedDecks
  useEffect(() => {
    localStorage.setItem('arenaforge_saved_decks', JSON.stringify(savedDecks));
  }, [savedDecks]);

  useEffect(() => {
    localStorage.setItem('arenaforge_wildcard_inventory', JSON.stringify(wildcardInventory));
  }, [wildcardInventory]);

  useEffect(() => {
    localStorage.setItem('arenaforge_user_collection', JSON.stringify(userCollection));
  }, [userCollection]);

  // Derived Calculations
  const wildcardCost = useMemo(() => {
    return calculateDeckWildcards(
      activeDeck.mainboard,
      activeDeck.sideboard,
      activeDeck.commander,
      userCollection,
      wildcardInventory
    );
  }, [activeDeck, userCollection, wildcardInventory]);

  const deckStats = useMemo(() => {
    return calculateDeckStats(activeDeck.mainboard);
  }, [activeDeck.mainboard]);

  const deckCardNames = useMemo(() => {
    return new Set(activeDeck.mainboard.map(c => c.card.name));
  }, [activeDeck.mainboard]);

  const deckCardIds = useMemo(() => {
    return new Set(activeDeck.mainboard.map(c => c.card.id));
  }, [activeDeck.mainboard]);

  // Deck Manipulation Handlers
  const handleAddCard = (card: Card, toSideboard: boolean = false) => {
    const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name);
    const list = toSideboard ? [...activeDeck.sideboard] : [...activeDeck.mainboard];
    // In Magic formats, card uniqueness and singleton constraints are strictly governed by English card name, not printing/art ID
    const index = list.findIndex(c => c.card.name === card.name);

    if (activeDeck.format === 'brawl') {
      // Strict Brawl Singleton Enforcement: Max 1 copy for non-basic lands!
      if (!isBasic && index >= 0) {
        return;
      }
    }

    if (index >= 0) {
      if (!isBasic && list[index].quantity >= 4) {
        return;
      }
      list[index] = { ...list[index], quantity: list[index].quantity + 1 };
    } else {
      list.push({ card, quantity: 1 });
    }

    if (toSideboard) {
      setActiveDeck({ ...activeDeck, sideboard: list, updatedAt: new Date().toISOString() });
    } else {
      setActiveDeck({ ...activeDeck, mainboard: list, updatedAt: new Date().toISOString() });
    }
  };

  const handleRemoveCard = (card: Card) => {
    // In Brawl & Singleton formats, remove by card name or ID
    const nextMain = activeDeck.mainboard.filter(c => c.card.name !== card.name && c.card.id !== card.id);
    const nextSide = activeDeck.sideboard.filter(c => c.card.name !== card.name && c.card.id !== card.id);
    setActiveDeck({
      ...activeDeck,
      mainboard: nextMain,
      sideboard: nextSide,
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateDeck = (updated: Deck) => {
    setActiveDeck(updated);
  };

  const handleChangeFormat = (format: FormatType) => {
    setActiveDeck(prev => ({
      ...prev,
      format,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleClearDeck = () => {
    setActiveDeck(prev => ({
      ...prev,
      mainboard: [],
      sideboard: [],
      updatedAt: new Date().toISOString()
    }));
  };

  // Auto-Clean on Commander Pick (Item #1 from user request)
  const handleSelectCommander = (card: Card) => {
    setActiveDeck({
      id: `brawl-${card.id}-${Date.now()}`,
      name: `${card.name} Brawl`,
      format: 'brawl',
      commander: { card, quantity: 1 },
      mainboard: [], // Starts with a clean singleton list
      sideboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleImportDeck = (imported: Partial<Deck>) => {
    setActiveDeck(prev => ({
      ...prev,
      ...imported,
      updatedAt: new Date().toISOString()
    }));
  };

  // Multiple Deck Management Handlers (Load, Create, Duplicate, Rename, Delete)
  const handleLoadDeck = (deck: Deck) => {
    setActiveDeck(deck);
    setNavTab('deck_builder');
  };

  const handleCreateNewDeck = (format: FormatType) => {
    let newDeck: Deck;
    if (format === 'brawl') {
      const defaultCommander = ARENA_CARDS.find(c => c.name.includes('Liliana')) || ARENA_CARDS[0];
      newDeck = {
        id: `deck-brawl-${Date.now()}`,
        name: `New ${defaultCommander.name} Brawl`,
        format: 'brawl',
        commander: { card: defaultCommander, quantity: 1 },
        mainboard: [],
        sideboard: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      newDeck = {
        id: `deck-${format}-${Date.now()}`,
        name: `New ${format.toUpperCase()} Deck`,
        format: format,
        mainboard: [],
        sideboard: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    setSavedDecks(prev => [newDeck, ...prev]);
    setActiveDeck(newDeck);
    setNavTab('deck_builder');
  };

  const handleDeleteDeck = (deckId: string) => {
    setSavedDecks(prev => {
      const next = prev.filter(d => d.id !== deckId);
      // If user deletes the currently active deck, switch to the first remaining one
      if (activeDeck.id === deckId && next.length > 0) {
        setActiveDeck(next[0]);
      }
      return next;
    });
  };

  const handleDuplicateDeck = (deck: Deck) => {
    const copy: Deck = {
      ...deck,
      id: `deck-copy-${Date.now()}`,
      name: `${deck.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSavedDecks(prev => [copy, ...prev]);
  };

  const handleRenameDeck = (deckId: string, newName: string) => {
    setSavedDecks(prev => prev.map(d => d.id === deckId ? { ...d, name: newName, updatedAt: new Date().toISOString() } : d));
    if (activeDeck.id === deckId) {
      setActiveDeck(prev => ({ ...prev, name: newName, updatedAt: new Date().toISOString() }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Shell */}
      <ArenaNavbar
        currentTab={navTab}
        onSelectTab={setNavTab}
        currentFormat={activeDeck.format}
        onSelectFormat={handleChangeFormat}
        inventory={wildcardInventory}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenExport={() => setExportImportMode('export')}
        hasCommander={!!activeDeck.commander}
        deckCount={savedDecks.length}
      />

      {/* Main App Content */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 flex flex-col space-y-6">
        {navTab === 'my_decks' ? (
          /* Multi-Deck Library View */
          <MyDecksView
            savedDecks={savedDecks}
            activeDeckId={activeDeck.id}
            onLoadDeck={handleLoadDeck}
            onCreateNewDeck={handleCreateNewDeck}
            onDeleteDeck={handleDeleteDeck}
            onDuplicateDeck={handleDuplicateDeck}
            onRenameDeck={handleRenameDeck}
            userCollection={userCollection}
          />
        ) : navTab === 'card_library' ? (
          /* Full Screen Card Library View */
          <CardLibraryView
            onSelectCardDetail={setSelectedCardDetail}
            onAddCardToDeck={card => handleAddCard(card, false)}
          />
        ) : activeDeck.format === 'brawl' ? (
          /* Dedicated Brawl Hero Experience */
          <div className="space-y-6">
            {/* Command Zone (Hero In-Game Art Presentation) */}
            <BrawlCommandZone
              commander={activeDeck.commander?.card}
              deck={activeDeck}
              wildcardCost={wildcardCost}
              onOpenCommanderPicker={() => setIsCommanderPickerOpen(true)}
              onClearDeck={handleClearDeck}
              onToggleDeckDrawer={() => setIsDeckDrawerOpen(!isDeckDrawerOpen)}
              isDeckDrawerOpen={isDeckDrawerOpen}
              activeSubMode={brawlSubMode}
              onSelectSubMode={setBrawlSubMode}
              selectedRoleTab={synergyTab}
              onSelectRoleFilter={(role) => {
                if (role === 'ramp') setSynergyTab('ramp');
                else if (role === 'protection') setSynergyTab('protection');
                else if (role === 'removal') setSynergyTab('removal');
                else if (role === 'board_wipe') setSynergyTab('board_wipe');
                else if (role === 'card_advantage') setSynergyTab('card_draw');
                else if (role === 'lands') setSynergyTab('lands');
              }}
            />

            {/* Multi-Tabbed Synergy Console Directly Below */}
            {activeDeck.commander && (
              <BrawlSynergyConsole
                commander={activeDeck.commander.card}
                onAddCard={card => handleAddCard(card, false)}
                onRemoveCard={handleRemoveCard}
                onSelectCardDetail={setSelectedCardDetail}
                userCollection={userCollection}
                deckCardIds={deckCardIds}
                deckCardNames={deckCardNames}
                activeTab={synergyTab}
                onSelectTab={setSynergyTab}
              />
            )}
          </div>
        ) : (
          /* Constructed Formats (Standard / Pioneer) Dual Panel */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 h-[calc(100vh-180px)] sticky top-20">
              <CardSearchPanel
                currentFormat={activeDeck.format}
                onAddCard={handleAddCard}
                onSelectCardDetail={setSelectedCardDetail}
              />
            </div>
            <div className="lg:col-span-7 h-[calc(100vh-180px)] sticky top-20">
              <DeckListWorkspace
                deck={activeDeck}
                userCollection={userCollection}
                onUpdateDeck={handleUpdateDeck}
                onSelectCardDetail={setSelectedCardDetail}
              />
            </div>
          </div>
        )}
      </main>

      {/* Slide-out Deck Tray (Drawer) */}
      <DeckDrawer
        isOpen={isDeckDrawerOpen}
        onClose={() => setIsDeckDrawerOpen(false)}
        deck={activeDeck}
        onUpdateDeck={handleUpdateDeck}
        onSelectCardDetail={setSelectedCardDetail}
        onOpenExport={() => setExportImportMode('export')}
        wildcardCost={wildcardCost}
        userCollection={userCollection}
      />

      {/* Modals */}
      <CommanderPickerModal
        isOpen={isCommanderPickerOpen}
        onClose={() => setIsCommanderPickerOpen(false)}
        onSelectCommander={handleSelectCommander}
      />

      <CardDetailModal
        card={selectedCardDetail}
        onClose={() => setSelectedCardDetail(null)}
        onAddCard={handleAddCard}
      />

      <AnalyticsModal
        stats={deckStats}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      <GoldfishModal
        mainboard={activeDeck.mainboard}
        isOpen={isGoldfishOpen}
        onClose={() => setIsGoldfishOpen(false)}
        onSelectCardDetail={setSelectedCardDetail}
      />

      <CollectionSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onSyncCollection={setUserCollection}
        currentCollectionCount={Object.keys(userCollection).length}
      />

      <ExportImportModal
        deck={activeDeck}
        isOpen={exportImportMode !== null}
        mode={exportImportMode || 'export'}
        onClose={() => setExportImportMode(null)}
        onImportDeck={handleImportDeck}
      />
    </div>
  );
};

export default App;

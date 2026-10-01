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
import { SaveDeckConflictModal } from './components/SaveDeckConflictModal';
import { SaveBeforeCommanderChangeModal } from './components/SaveBeforeCommanderChangeModal';
import { ImportDeckModal } from './components/ImportDeckModal';
import { MyCollectionView } from './components/MyCollectionView';
import { ManaBaseModal } from './components/ManaBaseModal';
import { calculateDeckWildcards } from './utils/wildcardCalculator';
import { calculateDeckStats } from './utils/deckAnalytics';
import { getMaxCardCopies } from './utils/cardRules';
import { ARENA_CARDS } from './data/arenaCards';
import { Layers } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [navTab, setNavTab] = useState<MainNavTab>('deck_builder');
  const [brawlSubMode, setBrawlSubMode] = useState<BrawlSubMode>('brawl_historic');
  const [synergyTab, setSynergyTab] = useState<SynergyCategoryTab>('creatures');
  const [isDeckDrawerOpen, setIsDeckDrawerOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('arenaforge_deck_tray_open');
    return saved !== null ? saved === 'true' : true;
  });

  // Saved Decks Collection (All user-created decks)
  const [savedDecks, setSavedDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem('arenaforge_saved_decks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((deck: Deck) => {
            if (deck?.commander?.card) {
              const matched = ARENA_CARDS.find(
                c => c.id === deck.commander?.card.id || c.name.toLowerCase() === deck.commander?.card.name.toLowerCase()
              );
              if (matched) {
                deck.commander.card.imageUrl = matched.imageUrl;
              }
            }
            return deck;
          });
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
        const parsed: Deck = JSON.parse(saved);
        if (parsed?.commander?.card) {
          const cmdCard = parsed.commander.card;
          const matched = ARENA_CARDS.find(
            c => c.id === cmdCard.id || c.name.toLowerCase() === cmdCard.name.toLowerCase()
          );
          if (matched) {
            cmdCard.imageUrl = matched.imageUrl;
          }
        }
        return parsed;
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
  const [isImportDeckModalOpen, setIsImportDeckModalOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import' | null>(null);
  const [selectedCardDetail, setSelectedCardDetail] = useState<Card | null>(null);

  // Save Conflict & Notification State
  const [saveConflict, setSaveConflict] = useState<{
    deckToSave: Deck;
    conflictingDeck: Deck;
    onResolved?: () => void;
  } | null>(null);
  const [pendingCommanderChange, setPendingCommanderChange] = useState<Card | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Persist activeDeck
  useEffect(() => {
    localStorage.setItem('arenaforge_active_deck', JSON.stringify(activeDeck));
  }, [activeDeck]);

  // Persist deck tray open/close preference
  useEffect(() => {
    localStorage.setItem('arenaforge_deck_tray_open', String(isDeckDrawerOpen));
  }, [isDeckDrawerOpen]);

  // Synchronize active commander imageUrl with canonical catalog if outdated
  useEffect(() => {
    if (activeDeck.commander?.card) {
      const matched = ARENA_CARDS.find(
        c => c.id === activeDeck.commander?.card.id || c.name.toLowerCase() === activeDeck.commander?.card.name.toLowerCase()
      );
      if (matched && matched.imageUrl !== activeDeck.commander.card.imageUrl) {
        setActiveDeck(prev => ({
          ...prev,
          commander: {
            ...prev.commander!,
            card: { ...prev.commander!.card, imageUrl: matched.imageUrl }
          }
        }));
      }
    }
  }, [activeDeck.commander?.card?.name]);

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

  const deckCardCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of activeDeck.mainboard) {
      map.set(item.card.name.toLowerCase().trim(), item.quantity);
    }
    return map;
  }, [activeDeck.mainboard]);

  // Deck Manipulation Handlers
  const handleAddCard = (card: Card, toSideboard: boolean = false) => {
    const list = toSideboard ? [...activeDeck.sideboard] : [...activeDeck.mainboard];
    // In Magic formats, card uniqueness and copy constraints are strictly governed by English card name
    const index = list.findIndex(c => c.card.name.toLowerCase().trim() === card.name.toLowerCase().trim());
    const maxAllowed = getMaxCardCopies(card, activeDeck.format);

    if (index >= 0) {
      if (list[index].quantity >= maxAllowed) {
        return; // Already reached the maximum copies allowed
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

  const handleRemoveCard = (card: Card, removeAll: boolean = false) => {
    const updateList = (items: typeof activeDeck.mainboard) => {
      const idx = items.findIndex(c => 
        c.card.name.toLowerCase().trim() === card.name.toLowerCase().trim() || c.card.id === card.id
      );
      if (idx < 0) return items;
      if (removeAll || items[idx].quantity <= 1) {
        return items.filter((_, i) => i !== idx);
      }
      const updated = [...items];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
      return updated;
    };

    setActiveDeck({
      ...activeDeck,
      mainboard: updateList(activeDeck.mainboard),
      sideboard: updateList(activeDeck.sideboard),
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

  const applyNewCommander = (card: Card) => {
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
    setPendingCommanderChange(null);
    setIsCommanderPickerOpen(false);
  };

  // Auto-Clean on Commander Pick with Save Prompt if Deck has Cards
  const handleSelectCommander = (card: Card) => {
    if (activeDeck.commander?.card.id === card.id) {
      setIsCommanderPickerOpen(false);
      return;
    }

    // If deck is empty (no cards added yet), switch commander without prompting
    if (activeDeck.mainboard.length === 0) {
      applyNewCommander(card);
      return;
    }

    // Active deck has cards in it: close picker and prompt user about saving changes
    setIsCommanderPickerOpen(false);
    setPendingCommanderChange(card);
  };

  const handleSaveDeckAndSwitchCommander = (newCommander: Card) => {
    const commanderName = activeDeck.commander?.card.name;

    // Check conflict against existing saved decks (excluding current deck id)
    if (commanderName) {
      const conflict = savedDecks.find(d => 
        d.id !== activeDeck.id && 
        d.commander?.card.name.toLowerCase() === commanderName.toLowerCase()
      );

      if (conflict) {
        setPendingCommanderChange(null);
        setSaveConflict({
          deckToSave: activeDeck,
          conflictingDeck: conflict,
          onResolved: () => applyNewCommander(newCommander)
        });
        return;
      }
    }

    // Direct save if no conflict
    setSavedDecks(prev => {
      const idx = prev.findIndex(d => d.id === activeDeck.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...activeDeck, updatedAt: new Date().toISOString() };
        return next;
      } else {
        return [{ ...activeDeck, updatedAt: new Date().toISOString() }, ...prev];
      }
    });

    setSaveNotification(`Deck "${activeDeck.name}" successfully saved to My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);

    applyNewCommander(newCommander);
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

  // Explicit Save to My Decks with Commander Conflict Check
  const handleSaveActiveDeck = () => {
    const commanderName = activeDeck.commander?.card.name;

    // Check if another saved deck exists with the same commander (excluding the same deck id)
    if (commanderName) {
      const conflict = savedDecks.find(d => 
        d.id !== activeDeck.id && 
        d.commander?.card.name.toLowerCase() === commanderName.toLowerCase()
      );

      if (conflict) {
        // Trigger conflict resolution modal (overwrite vs save as new)
        setSaveConflict({
          deckToSave: activeDeck,
          conflictingDeck: conflict
        });
        return;
      }
    }

    // Direct save / update
    setSavedDecks(prev => {
      const idx = prev.findIndex(d => d.id === activeDeck.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...activeDeck, updatedAt: new Date().toISOString() };
        return next;
      } else {
        return [{ ...activeDeck, updatedAt: new Date().toISOString() }, ...prev];
      }
    });

    setSaveNotification(`Deck "${activeDeck.name}" successfully saved to My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleOverwriteConflict = () => {
    if (!saveConflict) return;
    const { deckToSave, conflictingDeck, onResolved } = saveConflict;

    setSavedDecks(prev => {
      // Replace the conflicting deck with the current deck data
      return prev.map(d => {
        if (d.id === conflictingDeck.id) {
          return {
            ...deckToSave,
            id: conflictingDeck.id,
            name: conflictingDeck.name,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      });
    });

    setActiveDeck(prev => ({ ...prev, id: conflictingDeck.id, name: conflictingDeck.name }));
    setSaveNotification(`Successfully overwrote "${conflictingDeck.name}" in My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);
    setSaveConflict(null);
    if (onResolved) {
      onResolved();
    }
  };

  const handleSaveAsNewConflict = (newName: string) => {
    if (!saveConflict) return;
    const { deckToSave, onResolved } = saveConflict;

    const newDeck: Deck = {
      ...deckToSave,
      id: `deck-${Date.now()}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSavedDecks(prev => [newDeck, ...prev]);
    setActiveDeck(newDeck);
    setSaveNotification(`Saved as new deck: "${newName}" in My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);
    setSaveConflict(null);
    if (onResolved) {
      onResolved();
    }
  };

  const handleSaveImportedDeck = (newDeck: Deck, openInBuilder: boolean) => {
    setSavedDecks(prev => {
      const idx = prev.findIndex(d => d.id === newDeck.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newDeck;
        return copy;
      }
      return [newDeck, ...prev];
    });

    if (openInBuilder) {
      setActiveDeck(newDeck);
      setNavTab('deck_builder');
    }

    setSaveNotification(`Successfully imported "${newDeck.name}"!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleSyncDecks = (newDecks: Deck[]) => {
    if (newDecks.length === 0) return;
    setSavedDecks(prev => {
      const existingNames = new Set(prev.map(d => d.name.toLowerCase()));
      const toAdd = newDecks.filter(d => !existingNames.has(d.name.toLowerCase()));
      return [...toAdd, ...prev];
    });
    setSaveNotification(`Synced ${newDecks.length} deck(s) from MTG Arena!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
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
      <main className="max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col space-y-6">
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
            onOpenImportModal={() => setIsImportDeckModalOpen(true)}
            userCollection={userCollection}
          />
        ) : navTab === 'my_collection' ? (
          /* Full Screen My Collection View */
          <MyCollectionView
            userCollection={userCollection}
            wildcardInventory={wildcardInventory}
            onSelectCardDetail={setSelectedCardDetail}
            onAddCardToDeck={card => handleAddCard(card, false)}
            onOpenSync={() => setIsSyncOpen(true)}
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
              onSaveDeck={handleSaveActiveDeck}
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

            {/* Side-by-Side: Synergy Console + Active Deck Tray */}
            <div className="relative flex flex-col lg:flex-row items-start gap-6">
              {/* Synergy Console */}
              <div className="flex-1 min-w-0 w-full transition-all duration-300">
                {activeDeck.commander && (
                  <BrawlSynergyConsole
                    commander={activeDeck.commander.card}
                    onAddCard={card => handleAddCard(card, false)}
                    onRemoveCard={handleRemoveCard}
                    onSelectCardDetail={setSelectedCardDetail}
                    userCollection={userCollection}
                    deckCardIds={deckCardIds}
                    deckCardNames={deckCardNames}
                    deckCardCounts={deckCardCounts}
                    activeTab={synergyTab}
                    onSelectTab={setSynergyTab}
                    isDeckTrayOpen={isDeckDrawerOpen}
                    onToggleDeckTray={() => setIsDeckDrawerOpen(prev => !prev)}
                  />
                )}
              </div>

              {/* Side-by-Side Active Deck Tray (Desktop) */}
              {isDeckDrawerOpen && (
                <aside className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0 sticky top-20 z-20">
                  <DeckDrawer
                    isOpen={true}
                    variant="inline"
                    onClose={() => setIsDeckDrawerOpen(false)}
                    deck={activeDeck}
                    onUpdateDeck={handleUpdateDeck}
                    onSelectCardDetail={setSelectedCardDetail}
                    onOpenExport={() => setExportImportMode('export')}
                    wildcardCost={wildcardCost}
                    userCollection={userCollection}
                  />
                </aside>
              )}
            </div>
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

      {/* Mobile Slide-out Deck Tray (Drawer for < lg screens) */}
      <div className="lg:hidden">
        <DeckDrawer
          isOpen={isDeckDrawerOpen}
          variant="drawer"
          onClose={() => setIsDeckDrawerOpen(false)}
          deck={activeDeck}
          onUpdateDeck={handleUpdateDeck}
          onSelectCardDetail={setSelectedCardDetail}
          onOpenExport={() => setExportImportMode('export')}
          wildcardCost={wildcardCost}
          userCollection={userCollection}
        />
      </div>

      {/* Floating Edge Tab to easily unhide Deck Tray when scrolled down on desktop */}
      {!isDeckDrawerOpen && navTab === 'deck_builder' && activeDeck.format === 'brawl' && (
        <button
          onClick={() => setIsDeckDrawerOpen(true)}
          className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#121622]/95 hover:bg-[#1a2030] text-amber-300 border-l border-y border-amber-500/40 px-2.5 py-4 rounded-l-2xl shadow-2xl flex-col items-center gap-2 group transition duration-200 cursor-pointer"
          title="Show Active Deck Tray"
        >
          <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          <span className="[writing-mode:vertical-rl] text-[10px] font-fantasy font-black tracking-wider text-stone-200 uppercase">
            Deck Tray ({activeDeck.mainboard.reduce((a, b) => a + b.quantity, 0) + (activeDeck.commander ? 1 : 0)}/{activeDeck.format === 'brawl' ? 100 : 60})
          </span>
        </button>
      )}

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
        commander={activeDeck.commander?.card}
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
        onSyncDecks={handleSyncDecks}
        currentCollectionCount={Object.keys(userCollection).length}
      />

      <ImportDeckModal
        isOpen={isImportDeckModalOpen}
        onClose={() => setIsImportDeckModalOpen(false)}
        onSaveDeck={handleSaveImportedDeck}
      />

      <ExportImportModal
        deck={activeDeck}
        isOpen={exportImportMode !== null}
        mode={exportImportMode || 'export'}
        onClose={() => setExportImportMode(null)}
        onImportDeck={handleImportDeck}
      />

      {/* Commander Conflict Resolution Modal */}
      {saveConflict && (
        <SaveDeckConflictModal
          isOpen={true}
          onClose={() => setSaveConflict(null)}
          deckToSave={saveConflict.deckToSave}
          conflictingDeck={saveConflict.conflictingDeck}
          onOverwrite={handleOverwriteConflict}
          onSaveAsNew={handleSaveAsNewConflict}
        />
      )}

      {/* Save Deck Before Changing Commander Modal */}
      {pendingCommanderChange && (
        <SaveBeforeCommanderChangeModal
          isOpen={true}
          onClose={() => setPendingCommanderChange(null)}
          currentDeck={activeDeck}
          newCommander={pendingCommanderChange}
          onSaveAndChange={() => handleSaveDeckAndSwitchCommander(pendingCommanderChange)}
          onDiscardAndChange={() => applyNewCommander(pendingCommanderChange)}
        />
      )}

      {/* Save Success Toast Banner */}
      {saveNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121622] border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border-l-4 border-l-emerald-500">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold">{saveNotification}</span>
        </div>
      )}

      {/* Footer with WotC Fan Content Policy Disclaimer */}
      <footer className="w-full border-t border-[#c5a059]/20 bg-[#080a0f]/80 backdrop-blur-md py-6 px-4 mt-auto text-center text-xs text-stone-500 space-y-1">
        <p className="font-fantasy font-bold text-stone-300 tracking-wider">
          ARENA<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">FORGE</span> DECKBUILDER
        </p>
        <p className="max-w-3xl mx-auto text-[11px] text-stone-400 leading-relaxed">
          ArenaForge is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy.
          Portions of the materials used are property of Wizards of the Coast. &copy;Wizards of the Coast LLC.
        </p>
      </footer>
    </div>
  );
};

export default App;

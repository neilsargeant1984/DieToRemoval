import React, { useState, useEffect, useMemo } from 'react';
import { Card, FormatType } from './types/card';
import { Deck } from './types/deck';
import { UserCollection, WildcardInventory } from './types/collection';
import { META_DECKS } from './data/metaDecks';
import { Header } from './components/Header';
import { WildcardBar } from './components/WildcardBar';
import { CardSearchPanel } from './components/CardSearchPanel';
import { DeckListWorkspace } from './components/DeckListWorkspace';
import { CardDetailModal } from './components/CardDetailModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { GoldfishModal } from './components/GoldfishModal';
import { CollectionSyncModal } from './components/CollectionSyncModal';
import { MetaDecksModal } from './components/MetaDecksModal';
import { ExportImportModal } from './components/ExportImportModal';
import { calculateDeckWildcards } from './utils/wildcardCalculator';
import { calculateDeckStats } from './utils/deckAnalytics';

export const App: React.FC = () => {
  // Active Deck State
  const [activeDeck, setActiveDeck] = useState<Deck>(() => {
    const saved = localStorage.getItem('arenaforge_active_deck');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return META_DECKS[0]; // Start with Timeless Boros Energy
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

  // Modal States
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isGoldfishOpen, setIsGoldfishOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import' | null>(null);
  const [selectedCardDetail, setSelectedCardDetail] = useState<Card | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('arenaforge_active_deck', JSON.stringify(activeDeck));
  }, [activeDeck]);

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

  const hasCollectionLoaded = Object.keys(userCollection).length > 0;

  // Deck Modification Handlers
  const handleAddCard = (card: Card, toSideboard: boolean = false) => {
    const list = toSideboard ? [...activeDeck.sideboard] : [...activeDeck.mainboard];
    const index = list.findIndex(c => c.card.id === card.id);

    const isBasic = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'].includes(card.name);

    if (index >= 0) {
      if (!isBasic && list[index].quantity >= 4) {
        return; // Enforce Arena 4-of max
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

  const handleNewDeck = () => {
    setActiveDeck({
      id: `deck-${Date.now()}`,
      name: 'Untitled Arena Brew',
      format: activeDeck.format,
      mainboard: [],
      sideboard: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleLoadMetaDeck = (deck: Deck) => {
    setActiveDeck({ ...deck });
  };

  const handleSyncCollection = (newCollection: UserCollection) => {
    setUserCollection(newCollection);
  };

  const handleImportDeck = (imported: Partial<Deck>) => {
    setActiveDeck(prev => ({
      ...prev,
      ...imported,
      updatedAt: new Date().toISOString()
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        currentFormat={activeDeck.format}
        onChangeFormat={handleChangeFormat}
        onOpenMetaDecks={() => setIsMetaOpen(true)}
        onOpenSyncCollection={() => setIsSyncOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenGoldfish={() => setIsGoldfishOpen(true)}
        onOpenExport={() => setExportImportMode('export')}
        onOpenImport={() => setExportImportMode('import')}
        onNewDeck={handleNewDeck}
        collectionCount={Object.keys(userCollection).length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1 flex flex-col space-y-4">
        {/* Wildcard Crafting Status Banner */}
        <WildcardBar
          cost={wildcardCost}
          inventory={wildcardInventory}
          onUpdateInventory={setWildcardInventory}
          hasCollectionLoaded={hasCollectionLoaded}
        />

        {/* Dual Panel Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
          {/* Left Column: Instant Arena Card Explorer */}
          <div className="lg:col-span-5 h-[calc(100vh-210px)] sticky top-20">
            <CardSearchPanel
              currentFormat={activeDeck.format}
              onAddCard={handleAddCard}
              onSelectCardDetail={setSelectedCardDetail}
            />
          </div>

          {/* Right Column: Deckbuilder Workspace */}
          <div className="lg:col-span-7 h-[calc(100vh-210px)] sticky top-20">
            <DeckListWorkspace
              deck={activeDeck}
              userCollection={userCollection}
              onUpdateDeck={handleUpdateDeck}
              onSelectCardDetail={setSelectedCardDetail}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
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
        onSyncCollection={handleSyncCollection}
        currentCollectionCount={Object.keys(userCollection).length}
      />

      <MetaDecksModal
        isOpen={isMetaOpen}
        onClose={() => setIsMetaOpen(false)}
        onLoadDeck={handleLoadMetaDeck}
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

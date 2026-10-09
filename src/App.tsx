import React, { useState, useEffect, useMemo } from 'react';
import { Card, FormatType } from './types/card';
import { Deck, DeckCard } from './types/deck';
import { UserCollection, WildcardInventory } from './types/collection';
import { ArenaNavbar, MainNavTab } from './components/ArenaNavbar';
import { BrawlCommandZone } from './components/BrawlCommandZone';
import { PowerTier } from './utils/bracketEvaluator';
import { isHellQueueCommander } from './data/arenaCardWeights';
import { BrawlSynergyConsole, SynergyCategoryTab } from './components/BrawlSynergyConsole';
import { DeckDrawer } from './components/DeckDrawer';
import { CardLibraryView } from './components/CardLibraryView';
import { CardSearchPanel } from './components/CardSearchPanel';
import { DeckListWorkspace } from './components/DeckListWorkspace';
import { CardDetailModal } from './components/CardDetailModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { GoldfishModal } from './components/GoldfishModal';
import { MetaDecksModal } from './components/MetaDecksModal';
import { ExportImportModal } from './components/ExportImportModal';
import { CommanderFinderModal } from './components/CommanderFinderModal';
import { StandardMetaModal } from './components/StandardMetaModal';
import { MyDecksView } from './components/MyDecksView';
import { SaveDeckConflictModal } from './components/SaveDeckConflictModal';
import { SaveBeforeCommanderChangeModal } from './components/SaveBeforeCommanderChangeModal';
import { ImportDeckModal } from './components/ImportDeckModal';
import { HomeView } from './components/HomeView';
import { ManaBaseModal } from './components/ManaBaseModal';
import { SynergyMatrixDrawer } from './components/SynergyMatrixDrawer';
import { calculateDeckWildcards } from './utils/wildcardCalculator';
import { calculateDeckStats } from './utils/deckAnalytics';
import { getMaxCardCopies } from './utils/cardRules';
import { ARENA_CARDS } from './data/arenaCards';
import { parsePlayerLogDecks } from './utils/arenaParser';
import { fetchCardByArenaId } from './services/scryfallService';
import { Layers, Search, Coffee, ExternalLink } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { deckCloudService } from './services/deckCloudService';
import { localAccountService } from './services/localAccountService';
import { generateDeckId, isValidUuid } from './utils/uuid';
import { AuthModal } from './components/AuthModal';
import { WildcardEditModal } from './components/WildcardEditModal';
import { CollectionSyncModal } from './components/CollectionSyncModal';
import { NewDeckModal } from './components/NewDeckModal';
import { FunctionalRole } from './utils/roleClassifier';

export const App: React.FC = () => {
  // Navigation State (Defaults to Home / News Hub)
  const [navTab, setNavTab] = useState<MainNavTab>('home');
  const [brawlPowerTier, setBrawlPowerTier] = useState<PowerTier>('focused');
  const [synergyTab, setSynergyTab] = useState<SynergyCategoryTab>('meta_consensus');
  const [isDeckDrawerOpen, setIsDeckDrawerOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('arenaforge_deck_tray_open');
    return saved !== null ? saved === 'true' : true;
  });
  const [mobileConstructedTab, setMobileConstructedTab] = useState<'search' | 'decklist'>('search');

  // User Auth & Cloud State (Persistent on browser)
  const [user, setUser] = useState<any>(() => localAccountService.getLocalAccount());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isWildcardModalOpen, setIsWildcardModalOpen] = useState<boolean>(false);

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
    // Default initial deck - True Blank Slate
    return [{
      id: 'default-brawl-deck',
      name: 'New Brawl Deck',
      format: 'brawl',
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
    // Default initial deck - True Blank Slate
    return {
      id: 'default-brawl-deck',
      name: 'New Brawl Deck',
      format: 'brawl',
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
    return { common: 0, uncommon: 0, rare: 0, mythic: 0 };
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
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isStandardMetaOpen, setIsStandardMetaOpen] = useState(false);
  const [isCommanderPickerOpen, setIsCommanderPickerOpen] = useState(false);
  const [isImportDeckModalOpen, setIsImportDeckModalOpen] = useState(false);
  const [isManaModalOpen, setIsManaModalOpen] = useState(false);
  const [isSynergyMatrixOpen, setIsSynergyMatrixOpen] = useState(false);
  const [isNewDeckModalOpen, setIsNewDeckModalOpen] = useState(false);
  const [standardRoleFilter, setStandardRoleFilter] = useState<FunctionalRole | 'lands' | 'sideboard' | null>(null);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import' | null>(null);
  const [selectedCardDetail, setSelectedCardDetail] = useState<Card | null>(null);

  // Active Deck Derived Colors
  const activeDeckColors = useMemo(() => {
    if (activeDeck.format === 'brawl') {
      return activeDeck.commander?.card?.colorIdentity || [];
    }
    const colors = new Set<string>();
    activeDeck.mainboard.forEach(item => {
      (item.card.colorIdentity || []).forEach(c => colors.add(c));
    });
    return Array.from(colors);
  }, [activeDeck]);

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

  // Auto-heal empty imported decks on startup if local Arena log is accessible
  useEffect(() => {
    const hasEmptyImported = savedDecks.some(d => d.isImported && d.mainboard.length === 0);
    const activeEmptyImported = activeDeck.isImported && activeDeck.mainboard.length === 0;

    if (hasEmptyImported || activeEmptyImported) {
      fetch('/api/arena-log')
        .then(res => {
          if (!res.ok) return null;
          return res.text();
        })
        .then(async (logText) => {
          if (!logText) return;
          const { decks, newCollectionCards } = await parsePlayerLogDecks(logText);
          if (decks && decks.length > 0) {
            handleSyncDecks(decks);
            if (Object.keys(newCollectionCards).length > 0) {
              setUserCollection(prev => {
                const merged = { ...prev };
                for (const [cidStr, qty] of Object.entries(newCollectionCards)) {
                  const cid = parseInt(cidStr, 10);
                  merged[cid] = Math.max(merged[cid] || 0, qty);
                }
                return merged;
              });
            }
          }
        })
        .catch(() => {
          // Dev server endpoint not running or not accessible; silent fallback
        });
    }
  }, []);

  // Asynchronously resolve any fallback cards in activeDeck
  useEffect(() => {
    if (!activeDeck || activeDeck.mainboard.length === 0) return;
    const hasFallbacks = activeDeck.mainboard.some(c => c.card.name.startsWith('Arena Card') && c.card.arenaId);
    if (!hasFallbacks) return;

    let isMounted = true;
    (async () => {
      let hasUpdates = false;
      const updatedMainboard = [...activeDeck.mainboard];

      for (let i = 0; i < updatedMainboard.length; i++) {
        const item = updatedMainboard[i];
        if (item.card.name.startsWith('Arena Card') && item.card.arenaId) {
          const resolved = await fetchCardByArenaId(item.card.arenaId);
          if (resolved && isMounted) {
            updatedMainboard[i] = { ...item, card: resolved };
            hasUpdates = true;
          }
          await new Promise(r => setTimeout(r, 120));
        }
      }

      if (hasUpdates && isMounted) {
        setActiveDeck(prev => ({
          ...prev,
          mainboard: updatedMainboard
        }));
        setSavedDecks(prev => prev.map(d => d.id === activeDeck.id ? { ...d, mainboard: updatedMainboard } : d));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [activeDeck.id]);

  // Supabase Auth, Browser Account & Cloud Sync Lifecycle
  useEffect(() => {
    // Check if there is an active local browser account
    const localAcc = localAccountService.getLocalAccount();
    if (localAcc) {
      setUser(localAcc);
    }

    if (!isSupabaseConfigured) return;

    // Check current session from Supabase on startup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const syncedAcc = localAccountService.syncWithSupabaseUser(currentUser);
        setUser(syncedAcc);
        // Bidirectional sync between local browser decks and Supabase
        const { syncedDecks, uploadedCount } = await deckCloudService.syncAllDecks(savedDecks);
        if (syncedDecks.length > 0) {
          setSavedDecks(syncedDecks);
          if (uploadedCount > 0) {
            setSaveNotification(`Synced ${syncedDecks.length} deck(s) (${uploadedCount} uploaded to cloud)!`);
            setTimeout(() => setSaveNotification(null), 3500);
          }
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const syncedAcc = localAccountService.syncWithSupabaseUser(currentUser);
        setUser(syncedAcc);
        // Automatically sync and retrieve decks on login
        const { syncedDecks, uploadedCount, error } = await deckCloudService.syncAllDecks(savedDecks);
        if (!error && syncedDecks.length > 0) {
          setSavedDecks(syncedDecks);
          setSaveNotification(`Account ready! Retrieved ${syncedDecks.length} deck(s)${uploadedCount > 0 ? ` (${uploadedCount} uploaded)` : ''}.`);
          setTimeout(() => setSaveNotification(null), 3500);
        }
      } else {
        const local = localAccountService.getLocalAccount();
        if (!local || local.isCloudSynced) {
          setUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = async () => {
    const localAcc = localAccountService.getLocalAccount();
    if (localAcc) {
      setUser(localAcc);
    }
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const syncedAcc = localAccountService.syncWithSupabaseUser(session.user);
        setUser(syncedAcc);
        const { syncedDecks, uploadedCount } = await deckCloudService.syncAllDecks(savedDecks);
        if (syncedDecks.length > 0) {
          setSavedDecks(syncedDecks);
          setSaveNotification(`Signed in! Retrieved ${syncedDecks.length} deck(s)${uploadedCount > 0 ? ` (${uploadedCount} uploaded)` : ''}.`);
          setTimeout(() => setSaveNotification(null), 3500);
        }
      }
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localAccountService.clearLocalAccount();
    setUser(null);
    setSaveNotification('Signed out of account');
    setTimeout(() => setSaveNotification(null), 3000);
  };

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

  const sideboardCardCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of activeDeck.sideboard) {
      map.set(item.card.name.toLowerCase().trim(), item.quantity);
    }
    return map;
  }, [activeDeck.sideboard]);

  // Deck Manipulation Handlers
  const handleAddCard = (card: Card, toSideboard: boolean = false) => {
    const list = toSideboard ? [...activeDeck.sideboard] : [...activeDeck.mainboard];
    // In Magic formats, card uniqueness and copy constraints are strictly governed by English card name
    const index = list.findIndex(c => c.card.name.toLowerCase().trim() === card.name.toLowerCase().trim());
    const maxAllowed = getMaxCardCopies(card, activeDeck.format);

    // Calculate total copies across mainboard and sideboard
    const otherList = toSideboard ? activeDeck.mainboard : activeDeck.sideboard;
    const currentInThis = index >= 0 ? list[index].quantity : 0;
    const otherItem = otherList.find(c => c.card.name.toLowerCase().trim() === card.name.toLowerCase().trim());
    const currentInOther = otherItem ? otherItem.quantity : 0;

    if (currentInThis + currentInOther >= maxAllowed) {
      return; // Already reached the maximum copies allowed
    }

    if (index >= 0) {
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

  const handleRemoveCard = (card: Card, removeAll: boolean = false, fromSideboard?: boolean) => {
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

    if (fromSideboard === true) {
      setActiveDeck({
        ...activeDeck,
        sideboard: updateList(activeDeck.sideboard),
        updatedAt: new Date().toISOString()
      });
    } else if (fromSideboard === false) {
      setActiveDeck({
        ...activeDeck,
        mainboard: updateList(activeDeck.mainboard),
        updatedAt: new Date().toISOString()
      });
    } else {
      setActiveDeck({
        ...activeDeck,
        mainboard: updateList(activeDeck.mainboard),
        sideboard: updateList(activeDeck.sideboard),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleUpdateDeck = (updated: Deck) => {
    setActiveDeck(updated);
  };

  const handleSelectBrawlPowerTier = (tier: PowerTier) => {
    setBrawlPowerTier(tier);
    if (tier === 'max_power') {
      setSynergyTab('max_power');
    } else if (synergyTab === 'max_power') {
      setSynergyTab('meta_consensus');
    }
  };

  const handleChangeFormat = (format: FormatType) => {
    if (activeDeck.format === format) {
      if (format === 'brawl' && !activeDeck.commander) {
        setIsCommanderPickerOpen(true);
      }
      return;
    }

    // When switching format on a populated deck, seamlessly create a new deck in the selected format
    if (activeDeck.mainboard.length > 0 || (activeDeck.sideboard && activeDeck.sideboard.length > 0) || activeDeck.commander) {
      handleCreateNewDeck(format);
      if (format === 'brawl') {
        setSynergyTab('meta_consensus');
        setIsCommanderPickerOpen(true);
      }
      return;
    }

    setActiveDeck(prev => ({
      ...prev,
      format,
      name: prev.name.startsWith('New ') ? `New ${format.charAt(0).toUpperCase() + format.slice(1)} Deck` : prev.name,
      commander: format === 'brawl' ? prev.commander : undefined,
      updatedAt: new Date().toISOString()
    }));
    if (format === 'brawl') {
      setSynergyTab('meta_consensus');
      setIsCommanderPickerOpen(true);
    }
  };

  const handleClearDeck = () => {
    setActiveDeck(prev => ({
      ...prev,
      mainboard: [],
      sideboard: [],
      updatedAt: new Date().toISOString()
    }));
  };

  const handleApplyManaBase = (newLands: DeckCard[]) => {
    setActiveDeck(prev => {
      // Keep cards in mainboard that are NOT Lands
      const nonLands = prev.mainboard.filter(c => !c.card.types.includes('Land'));
      const updatedMain = [...nonLands, ...newLands];
      return {
        ...prev,
        mainboard: updatedMain,
        updatedAt: new Date().toISOString()
      };
    });
    const landCount = newLands.reduce((s, c) => s + c.quantity, 0);
    setSaveNotification(`Applied optimal ${landCount}-land MTG Arena mana base!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const applyNewCommander = (card: Card, targetTier?: PowerTier) => {
    const isHellQueue = isHellQueueCommander(card.name);
    const finalTier = targetTier || (isHellQueue ? 'max_power' : brawlPowerTier);

    setActiveDeck({
      id: generateDeckId(),
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
    handleSelectBrawlPowerTier(finalTier);
  };

  // Auto-Clean on Commander Pick with Save Prompt if Deck has Cards
  const handleSelectCommander = (card: Card, chosenTier?: PowerTier) => {
    const isHellQueue = isHellQueueCommander(card.name);
    const targetTier: PowerTier = chosenTier || (isHellQueue ? 'max_power' : brawlPowerTier);

    if (activeDeck.commander?.card.id === card.id) {
      if (chosenTier) {
        handleSelectBrawlPowerTier(targetTier);
      }
      setIsCommanderPickerOpen(false);
      return;
    }

    // If deck is empty (no cards added yet), switch commander without prompting
    if (activeDeck.mainboard.length === 0) {
      applyNewCommander(card, targetTier);
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
    let deckToLoad = deck;
    if (deck.mainboard.length === 0) {
      // Check if a populated version of this deck exists in savedDecks
      const normName = deck.name.toLowerCase().trim();
      const cleanName = normName.replace(/^\([a-z0-9]+\)\s*/, '');
      const populated = savedDecks.find(d => 
        d.id !== deck.id && 
        d.mainboard.length > 0 &&
        (d.name.toLowerCase().trim() === normName ||
         d.name.toLowerCase().replace(/^\([a-z0-9]+\)\s*/, '') === cleanName ||
         (d.commander?.card?.name && deck.commander?.card?.name && d.commander.card.name.toLowerCase().trim() === deck.commander.card.name.toLowerCase().trim()))
      );
      if (populated) {
        deckToLoad = populated;
      }
    }
    setActiveDeck(deckToLoad);
    setNavTab('deck_builder');
    if (deckToLoad.format === 'brawl') {
      setSynergyTab('meta_consensus');
    }
  };

  const handleCreateNewDeck = (format: FormatType) => {
    let newDeck: Deck;
    if (format === 'brawl') {
      newDeck = {
        id: generateDeckId(),
        name: `New Brawl Deck`,
        format: 'brawl',
        mainboard: [],
        sideboard: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSynergyTab('meta_consensus');
    } else {
      newDeck = {
        id: generateDeckId(),
        name: `New ${format.charAt(0).toUpperCase() + format.slice(1)} Deck`,
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

    if (user && isSupabaseConfigured) {
      deckCloudService.deleteDeck(deckId).catch(console.error);
    }
  };

  const handleDuplicateDeck = (deck: Deck) => {
    const copy: Deck = {
      ...deck,
      id: generateDeckId(),
      name: `${deck.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSavedDecks(prev => [copy, ...prev]);

    if (user && isSupabaseConfigured) {
      deckCloudService.saveDeck(copy).catch(console.error);
    }
  };

  const handleRenameDeck = (deckId: string, newName: string) => {
    const now = new Date().toISOString();
    setSavedDecks(prev => prev.map(d => d.id === deckId ? { ...d, name: newName, updatedAt: now } : d));
    if (activeDeck.id === deckId) {
      setActiveDeck(prev => ({ ...prev, name: newName, updatedAt: now }));
    }

    const deckToUpdate = savedDecks.find(d => d.id === deckId);
    if (deckToUpdate && user && isSupabaseConfigured) {
      deckCloudService.saveDeck({ ...deckToUpdate, name: newName, updatedAt: now }).catch(console.error);
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

    const currentDeckId = isValidUuid(activeDeck.id) ? activeDeck.id : generateDeckId();
    const updatedDeck: Deck = {
      ...activeDeck,
      id: currentDeckId,
      updatedAt: new Date().toISOString()
    };

    setActiveDeck(updatedDeck);

    // Direct save / update locally in browser
    setSavedDecks(prev => {
      const idx = prev.findIndex(d => d.id === currentDeckId || d.id === activeDeck.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedDeck;
        return next;
      } else {
        return [updatedDeck, ...prev];
      }
    });

    setSaveNotification(`Deck "${updatedDeck.name}" successfully saved to My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);

    // If user is authenticated, sync to Supabase Cloud
    if (user && isSupabaseConfigured) {
      deckCloudService.saveDeck(updatedDeck).then(({ data, error }) => {
        if (!error && data) {
          if (data.id !== updatedDeck.id) {
            setActiveDeck(prev => ({ ...prev, id: data.id }));
            setSavedDecks(prev => prev.map(d => d.id === updatedDeck.id ? { ...d, id: data.id } : d));
          }
          setSaveNotification(`Deck "${updatedDeck.name}" saved & synced to Supabase Cloud!`);
          setTimeout(() => setSaveNotification(null), 3500);
        } else if (error) {
          console.warn('Cloud save notice:', error);
          setSaveNotification(`Saved locally on browser (Cloud notice: ${error})`);
          setTimeout(() => setSaveNotification(null), 4000);
        }
      }).catch(err => {
        console.error(err);
        setSaveNotification(`Saved locally on browser (Cloud sync failed)`);
        setTimeout(() => setSaveNotification(null), 3500);
      });
    }
  };

  const handleOverwriteConflict = () => {
    if (!saveConflict) return;
    const { deckToSave, conflictingDeck, onResolved } = saveConflict;

    const now = new Date().toISOString();
    const updated = {
      ...deckToSave,
      id: conflictingDeck.id,
      name: conflictingDeck.name,
      updatedAt: now
    };

    setSavedDecks(prev => {
      return prev.map(d => {
        if (d.id === conflictingDeck.id) {
          return updated;
        }
        return d;
      });
    });

    setActiveDeck(updated);
    setSaveNotification(`Successfully overwrote "${conflictingDeck.name}" in My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);
    setSaveConflict(null);

    if (user && isSupabaseConfigured) {
      deckCloudService.saveDeck(updated).catch(console.error);
    }

    if (onResolved) {
      onResolved();
    }
  };

  const handleSaveAsNewConflict = (newName: string) => {
    if (!saveConflict) return;
    const { deckToSave, onResolved } = saveConflict;

    const newDeck: Deck = {
      ...deckToSave,
      id: generateDeckId(),
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSavedDecks(prev => [newDeck, ...prev]);
    setActiveDeck(newDeck);
    setSaveNotification(`Saved as new deck: "${newName}" in My Decks!`);
    setTimeout(() => setSaveNotification(null), 3500);
    setSaveConflict(null);

    if (user && isSupabaseConfigured) {
      deckCloudService.saveDeck(newDeck).catch(console.error);
    }

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

    if (user && isSupabaseConfigured) {
      deckCloudService.saveDeck(newDeck).catch(console.error);
    }

    setSaveNotification(`Successfully imported "${newDeck.name}"!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleSyncDecks = (newDecks: Deck[]) => {
    if (newDecks.length === 0) return;
    setSavedDecks(prev => {
      let updated = [...prev];
      for (const newDeck of newDecks) {
        const normNew = newDeck.name.toLowerCase().trim();
        const cleanNew = normNew.replace(/^\([a-z0-9]+\)\s*/, '');
        const existingIdx = updated.findIndex(d => {
          if (d.id === newDeck.id) return true;
          const normD = d.name.toLowerCase().trim();
          if (normD === normNew) return true;
          const cleanD = normD.replace(/^\([a-z0-9]+\)\s*/, '');
          if (cleanD === cleanNew && cleanD.length >= 3) return true;
          if (
            d.mainboard.length === 0 && 
            d.commander?.card?.name && 
            newDeck.commander?.card?.name && 
            d.commander.card.name.toLowerCase().trim() === newDeck.commander.card.name.toLowerCase().trim()
          ) {
            return true;
          }
          return false;
        });

        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...newDeck,
            id: updated[existingIdx].id || newDeck.id,
            name: updated[existingIdx].name || newDeck.name
          };
        } else {
          updated.unshift(newDeck);
        }
      }
      return updated;
    });

    // Also update activeDeck if activeDeck matches any synced deck
    setActiveDeck(prevActive => {
      if (!prevActive) return prevActive;
      const normActive = prevActive.name.toLowerCase().trim();
      const cleanActive = normActive.replace(/^\([a-z0-9]+\)\s*/, '');
      const matchedNew = newDecks.find(d => {
        if (d.id === prevActive.id) return true;
        const normD = d.name.toLowerCase().trim();
        if (normD === normActive) return true;
        const cleanD = normD.replace(/^\([a-z0-9]+\)\s*/, '');
        if (cleanD === cleanActive && cleanD.length >= 3) return true;
        if (
          prevActive.mainboard.length === 0 && 
          prevActive.commander?.card?.name && 
          d.commander?.card?.name && 
          prevActive.commander.card.name.toLowerCase().trim() === d.commander.card.name.toLowerCase().trim()
        ) {
          return true;
        }
        return false;
      });

      if (matchedNew && (prevActive.mainboard.length === 0 || matchedNew.mainboard.length >= prevActive.mainboard.length)) {
        return {
          ...matchedNew,
          id: prevActive.id || matchedNew.id,
          name: prevActive.name || matchedNew.name
        };
      }
      return prevActive;
    });

    setSaveNotification(`Synced ${newDecks.length} deck(s) from MTG Arena!`);
    setTimeout(() => setSaveNotification(null), 3500);
  };

  const handleSyncWildcards = (newInventory: WildcardInventory) => {
    setWildcardInventory(newInventory);
    if (user && isSupabaseConfigured) {
      deckCloudService.saveCollection(userCollection, newInventory).catch(console.error);
    }
    setSaveNotification(`Wildcard stash updated (${newInventory.common}C / ${newInventory.uncommon}U / ${newInventory.rare}R / ${newInventory.mythic}M)!`);
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
        onOpenSync={() => setIsWildcardModalOpen(true)}
        onOpenExport={() => setExportImportMode('export')}
        onOpenImport={() => setIsImportDeckModalOpen(true)}
        hasCommander={!!activeDeck.commander}
        deckCount={savedDecks.length}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenWildcards={() => setIsWildcardModalOpen(true)}
        onOpenCommanderFinder={() => setIsCommanderPickerOpen(true)}
      />

      {/* Main App Content */}
      <main className="max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col space-y-6">
        {navTab === 'home' ? (
          /* Home Page with Latest Set Release Console & News */
          <HomeView
            onSelectCardDetail={setSelectedCardDetail}
            onAddCardToDeck={card => handleAddCard(card, false)}
            userCollection={userCollection}
          />
        ) : navTab === 'my_decks' ? (
          /* Multi-Deck Library View */
          <MyDecksView
            savedDecks={savedDecks}
            activeDeckId={activeDeck.id}
            onLoadDeck={handleLoadDeck}
            onCreateNewDeck={handleCreateNewDeck}
            onOpenNewDeckModal={() => setIsNewDeckModalOpen(true)}
            onOpenCommanderFinder={() => setIsCommanderPickerOpen(true)}
            onDeleteDeck={handleDeleteDeck}
            onDuplicateDeck={handleDuplicateDeck}
            onRenameDeck={handleRenameDeck}
            onOpenImportModal={() => setIsImportDeckModalOpen(true)}
            onOpenSync={() => setIsWildcardModalOpen(true)}
            userCollection={userCollection}
          />
        ) : navTab === 'card_library' ? (
          /* Full Screen Card Library View */
          <CardLibraryView
            onSelectCardDetail={setSelectedCardDetail}
            onAddCardToDeck={card => handleAddCard(card, false)}
            userCollection={userCollection}
            onUpdateCollection={setUserCollection}
            initialFormat={activeDeck.format}
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
              onOpenImport={() => setIsImportDeckModalOpen(true)}
              onToggleDeckDrawer={() => setIsDeckDrawerOpen(!isDeckDrawerOpen)}
              isDeckDrawerOpen={isDeckDrawerOpen}
              activePowerTier={brawlPowerTier}
              onSelectPowerTier={handleSelectBrawlPowerTier}
              selectedRoleTab={synergyTab}
              onSelectRoleFilter={(role) => {
                if (role === 'ramp') setSynergyTab('ramp');
                else if (role === 'protection') setSynergyTab('protection');
                else if (role === 'removal') setSynergyTab('removal');
                else if (role === 'board_wipe') setSynergyTab('board_wipe');
                else if (role === 'card_advantage') setSynergyTab('card_draw');
                else if (role === 'lands') setSynergyTab('lands');
              }}
              onOpenManaOptimizer={() => setIsManaModalOpen(true)}
              onSelectCardDetail={setSelectedCardDetail}
            />

            {/* Side-by-Side: Synergy Console + Active Deck Tray */}
            <div className="relative flex flex-col lg:flex-row items-start gap-6">
              {/* Synergy Console */}
              <div className="flex-1 min-w-0 w-full transition-all duration-300">
                {activeDeck.commander && (
                  <BrawlSynergyConsole
                    commander={activeDeck.commander.card}
                    targetPowerTier={brawlPowerTier}
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
                    onOpenManaOptimizer={() => setIsManaModalOpen(true)}
                  />
                )}
              </div>

              {/* Side-by-Side Decklist (Desktop - 100% Unchanged) */}
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
                    onOpenImport={() => setIsImportDeckModalOpen(true)}
                    onOpenSync={() => setIsWildcardModalOpen(true)}
                    wildcardCost={wildcardCost}
                    userCollection={userCollection}
                    onAddCard={card => handleAddCard(card, false)}
                    onClearDeck={handleClearDeck}
                  />
                </aside>
              )}

              {/* Mobile Slide-Over Decklist Drawer (< lg only) */}
              {isDeckDrawerOpen && (
                <div className="block lg:hidden">
                  <DeckDrawer
                    isOpen={true}
                    variant="drawer"
                    onClose={() => setIsDeckDrawerOpen(false)}
                    deck={activeDeck}
                    onUpdateDeck={handleUpdateDeck}
                    onSelectCardDetail={setSelectedCardDetail}
                    onOpenExport={() => setExportImportMode('export')}
                    onOpenImport={() => setIsImportDeckModalOpen(true)}
                    onOpenSync={() => setIsWildcardModalOpen(true)}
                    wildcardCost={wildcardCost}
                    userCollection={userCollection}
                    onAddCard={card => handleAddCard(card, false)}
                    onClearDeck={handleClearDeck}
                  />
                </div>
              )}
            </div>

            {/* Mobile Floating Bottom Dock Pill (< lg only) */}
            <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden flex items-center justify-between p-2 rounded-2xl bg-[#0d1017]/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-bold text-stone-300">Deck:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg border font-mono ${
                  activeDeck.mainboard.reduce((acc, c) => acc + c.quantity, 0) + (activeDeck.commander ? 1 : 0) === 100
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}>
                  {activeDeck.mainboard.reduce((acc, c) => acc + c.quantity, 0) + (activeDeck.commander ? 1 : 0)} / 100
                </span>
                {wildcardCost.canCraftWithAvailableWildcards ? (
                  <span className="text-[10px] font-bold text-emerald-400">⚡ Craftable</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400">
                    Need {wildcardCost.missing.rare}R / {wildcardCost.missing.mythic}M
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDeckDrawerOpen(true)}
                className="btn-mythic-spark px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View Deck ▴</span>
              </button>
            </div>
          </div>
        ) : (
          /* Constructed Formats (Standard / Pioneer) Dual Panel */
          <div>
            {/* Mobile View Switcher (< lg only, completely hidden on desktop) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0d1017]/90 border border-white/5 lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setMobileConstructedTab('search')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mobileConstructedTab === 'search'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Card Explorer</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileConstructedTab('decklist')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mobileConstructedTab === 'decklist'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Decklist</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeDeck.mainboard.reduce((acc, c) => acc + c.quantity, 0) >= 60
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-white/10 text-stone-300'
                }`}>
                  {activeDeck.mainboard.reduce((acc, c) => acc + c.quantity, 0)}/60
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className={`lg:col-span-5 lg:h-[calc(100vh-180px)] lg:sticky lg:top-20 ${
                mobileConstructedTab === 'search' ? 'block' : 'hidden lg:block'
              }`}>
                <CardSearchPanel
                  currentFormat={activeDeck.format}
                  deckCardCounts={deckCardCounts}
                  sideboardCardCounts={sideboardCardCounts}
                  deckColors={activeDeckColors}
                  activeRoleFilter={standardRoleFilter}
                  onClearRoleFilter={() => setStandardRoleFilter(null)}
                  onAddCard={handleAddCard}
                  onRemoveCard={handleRemoveCard}
                  onSelectCardDetail={setSelectedCardDetail}
                  userCollection={userCollection}
                  onUpdateCollection={setUserCollection}
                />
              </div>
              <div className={`lg:col-span-7 lg:h-[calc(100vh-180px)] lg:sticky lg:top-20 ${
                mobileConstructedTab === 'decklist' ? 'block' : 'hidden lg:block'
              }`}>
                <DeckListWorkspace
                  deck={activeDeck}
                  userCollection={userCollection}
                  wildcardInventory={wildcardInventory}
                  onOpenWildcardModal={() => setIsWildcardModalOpen(true)}
                  onUpdateCollection={setUserCollection}
                  onUpdateDeck={handleUpdateDeck}
                  onSelectCardDetail={setSelectedCardDetail}
                  activeRoleFilter={standardRoleFilter}
                  onSelectRoleFilter={(role) => setStandardRoleFilter(prev => prev === role ? null : role)}
                  onOpenManaOptimizer={() => setIsManaModalOpen(true)}
                  onOpenSynergyMatrix={() => setIsSynergyMatrixOpen(true)}
                  onSaveDeck={handleSaveActiveDeck}
                  onOpenImport={() => setIsImportDeckModalOpen(true)}
                  onOpenExport={() => setExportImportMode('export')}
                  onOpenMetaDecks={() => setIsStandardMetaOpen(true)}
                  onClearDeck={handleClearDeck}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Slide-out Decklist (Drawer for < lg screens) */}
      <div className="lg:hidden">
        <DeckDrawer
          isOpen={isDeckDrawerOpen && navTab === 'deck_builder'}
          variant="drawer"
          onClose={() => setIsDeckDrawerOpen(false)}
          deck={activeDeck}
          onUpdateDeck={handleUpdateDeck}
          onSelectCardDetail={setSelectedCardDetail}
          onOpenExport={() => setExportImportMode('export')}
          onOpenImport={() => setIsImportDeckModalOpen(true)}
          onOpenSync={() => setIsWildcardModalOpen(true)}
          wildcardCost={wildcardCost}
          userCollection={userCollection}
          onAddCard={card => handleAddCard(card, false)}
          onClearDeck={handleClearDeck}
        />
      </div>

      {/* Floating Edge Tab to easily unhide Decklist when scrolled down on desktop */}
      {!isDeckDrawerOpen && navTab === 'deck_builder' && activeDeck.format === 'brawl' && (
        <button
          onClick={() => setIsDeckDrawerOpen(true)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const rawJson = e.dataTransfer.getData('application/json');
              if (rawJson) {
                const droppedCard = JSON.parse(rawJson);
                if (droppedCard && droppedCard.name) {
                  handleAddCard(droppedCard, false);
                  setIsDeckDrawerOpen(true);
                }
              }
            } catch (err) {
              console.error('Failed to handle drop on edge tab:', err);
            }
          }}
          className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#121622]/95 hover:bg-[#1a2030] text-amber-300 border-l border-y border-amber-500/40 px-2.5 py-4 rounded-l-2xl shadow-2xl flex-col items-center gap-2 group transition duration-200 cursor-pointer"
          title="Show Decklist (or drop card to add)"
        >
          <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          <span className="[writing-mode:vertical-rl] text-[10px] font-fantasy font-black tracking-wider text-stone-200 uppercase">
            Decklist ({activeDeck.mainboard.reduce((a, b) => a + b.quantity, 0) + (activeDeck.commander ? 1 : 0)}/{activeDeck.format === 'brawl' ? 100 : 60})
          </span>
        </button>
      )}

      {/* Modals */}
      <NewDeckModal
        isOpen={isNewDeckModalOpen}
        onClose={() => setIsNewDeckModalOpen(false)}
        onCreateDeck={(format) => {
          handleCreateNewDeck(format);
          setIsNewDeckModalOpen(false);
        }}
        onFindCommander={() => {
          handleCreateNewDeck('brawl');
          setIsNewDeckModalOpen(false);
          setIsCommanderPickerOpen(true);
        }}
      />

      <CommanderFinderModal
        isOpen={isCommanderPickerOpen}
        onClose={() => setIsCommanderPickerOpen(false)}
        onSelectCommander={handleSelectCommander}
        initialPowerTier={brawlPowerTier}
      />

      <StandardMetaModal
        isOpen={isStandardMetaOpen}
        onClose={() => setIsStandardMetaOpen(false)}
        onLoadDeck={(deck) => {
          handleLoadDeck(deck);
          setIsStandardMetaOpen(false);
        }}
        userCollection={userCollection}
        wildcardInventory={wildcardInventory}
        onOpenWildcards={() => setIsWildcardModalOpen(true)}
      />

      <CardDetailModal
        card={selectedCardDetail}
        onClose={() => setSelectedCardDetail(null)}
        onAddCard={handleAddCard}
        commander={activeDeck.commander?.card}
        userCollection={userCollection}
        onUpdateCollection={setUserCollection}
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

      {/* Wildcard Stash Manager Modal */}
      <WildcardEditModal
        isOpen={isWildcardModalOpen}
        onClose={() => setIsWildcardModalOpen(false)}
        inventory={wildcardInventory}
        onSaveInventory={handleSyncWildcards}
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

      {/* Causal Synergy Matrix Modal */}
      <SynergyMatrixDrawer
        isOpen={isSynergyMatrixOpen}
        onClose={() => setIsSynergyMatrixOpen(false)}
        commander={activeDeck.format === 'brawl' ? activeDeck.commander?.card : undefined}
        deck={activeDeck}
        onAddCard={(card) => handleAddCard(card, false)}
        userCollection={userCollection}
      />

      {/* Supabase Cloud Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
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

      {/* Mana Base Optimizer Modal */}
      <ManaBaseModal
        isOpen={isManaModalOpen}
        onClose={() => setIsManaModalOpen(false)}
        deck={activeDeck}
        onApplyManaBase={handleApplyManaBase}
        onSelectCardDetail={setSelectedCardDetail}
        userCollection={userCollection}
      />

      {/* Save Success Toast Banner */}
      {saveNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121622] border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 border-l-4 border-l-emerald-500">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold">{saveNotification}</span>
        </div>
      )}

      {/* Footer with WotC Fan Content Policy Disclaimer */}
      <footer className="w-full border-t border-[#c5a059]/20 bg-[#080a0f]/80 backdrop-blur-md py-6 px-4 mt-auto text-center text-xs text-stone-500 space-y-2">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <p className="font-fantasy font-bold text-stone-300 tracking-wider m-0">
            DIE<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">TO</span>REMOVAL<span className="text-rose-400">.GG</span>
          </p>
          <span className="text-stone-700 hidden sm:inline">•</span>
          <a
            href="https://buymeacoffee.com/triplecrowned"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition hover:underline"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Support this project</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>
        </div>
        <p className="max-w-3xl mx-auto text-[11px] text-stone-400 leading-relaxed">
          DieToRemoval (dietoremoval.gg) is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy.
          Portions of the materials used are property of Wizards of the Coast. &copy;Wizards of the Coast LLC.
        </p>
      </footer>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { Deck } from '../types/deck';
import { FormatType, ManaColor } from '../types/card';
import { UserCollection } from '../types/collection';
import { ManaCost } from './ManaCost';
import { CardImage } from './CardImage';
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  Copy, 
  Calendar, 
  Layers, 
  Crown, 
  Edit2, 
  Check, 
  Sparkles, 
  ArrowRight,
  Download,
  CloudDownload,
  Search,
  CheckCircle2,
  X,
  Flame,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface MyDecksViewProps {
  savedDecks: Deck[];
  activeDeckId?: string;
  onLoadDeck: (deck: Deck) => void;
  onCreateNewDeck: (format: FormatType) => void;
  onDeleteDeck: (deckId: string) => void;
  onDuplicateDeck: (deck: Deck) => void;
  onRenameDeck: (deckId: string, newName: string) => void;
  onOpenImportModal: () => void;
  onOpenSync?: () => void;
  onOpenNewDeckModal?: () => void;
  onOpenCommanderFinder?: () => void;
  userCollection: UserCollection;
}

// Helper to determine the deck's primary colors
const getDeckColors = (deck: Deck): ManaColor[] => {
  if (deck.commander?.card?.colorIdentity && deck.commander.card.colorIdentity.length > 0) {
    return deck.commander.card.colorIdentity as ManaColor[];
  }
  const colorSet = new Set<ManaColor>();
  for (const item of deck.mainboard) {
    const list = item.card.colorIdentity?.length ? item.card.colorIdentity : item.card.colors;
    if (list) {
      for (const c of list) {
        if (['W', 'U', 'B', 'R', 'G', 'C'].includes(c)) {
          colorSet.add(c as ManaColor);
        }
      }
    }
  }
  const order: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];
  return order.filter(c => colorSet.has(c));
};

// Helper to generate dynamic color identity ambient accents
const getDeckColorTheme = (colors: ManaColor[]) => {
  if (colors.length === 0) {
    return {
      borderGlow: 'hover:border-stone-400/60',
      ambientBg: 'from-stone-600/10 via-stone-900/30 to-transparent',
      accentPipText: 'text-stone-300'
    };
  }
  if (colors.length >= 3) {
    return {
      borderGlow: 'hover:border-amber-400/80 hover:shadow-[0_0_24px_rgba(245,158,11,0.22)]',
      ambientBg: 'from-amber-500/15 via-purple-600/10 to-transparent',
      accentPipText: 'text-amber-300'
    };
  }
  if (colors.includes('U') && colors.includes('R')) {
    return {
      borderGlow: 'hover:border-sky-400/80 hover:shadow-[0_0_24px_rgba(56,189,248,0.25)]',
      ambientBg: 'from-sky-500/20 via-red-500/15 to-transparent',
      accentPipText: 'text-sky-300'
    };
  }
  if (colors.includes('U') && colors.includes('B')) {
    return {
      borderGlow: 'hover:border-indigo-400/80 hover:shadow-[0_0_24px_rgba(129,140,248,0.25)]',
      ambientBg: 'from-blue-600/20 via-purple-900/25 to-transparent',
      accentPipText: 'text-indigo-300'
    };
  }
  if (colors.includes('B') && colors.includes('R')) {
    return {
      borderGlow: 'hover:border-rose-500/80 hover:shadow-[0_0_24px_rgba(244,63,94,0.25)]',
      ambientBg: 'from-rose-600/20 via-amber-600/15 to-transparent',
      accentPipText: 'text-rose-300'
    };
  }
  if (colors.includes('G') && colors.includes('B')) {
    return {
      borderGlow: 'hover:border-emerald-400/80 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]',
      ambientBg: 'from-emerald-600/20 via-purple-950/25 to-transparent',
      accentPipText: 'text-emerald-300'
    };
  }
  if (colors.includes('W') && colors.includes('U')) {
    return {
      borderGlow: 'hover:border-cyan-300/80 hover:shadow-[0_0_24px_rgba(125,211,252,0.25)]',
      ambientBg: 'from-sky-500/20 via-amber-200/10 to-transparent',
      accentPipText: 'text-cyan-300'
    };
  }
  if (colors.includes('W') && colors.includes('B')) {
    return {
      borderGlow: 'hover:border-amber-300/80 hover:shadow-[0_0_24px_rgba(252,211,77,0.2)]',
      ambientBg: 'from-amber-300/15 via-purple-950/25 to-transparent',
      accentPipText: 'text-amber-200'
    };
  }
  if (colors.includes('G') && colors.includes('W')) {
    return {
      borderGlow: 'hover:border-emerald-300/80 hover:shadow-[0_0_24px_rgba(110,231,183,0.25)]',
      ambientBg: 'from-emerald-500/20 via-amber-300/15 to-transparent',
      accentPipText: 'text-emerald-200'
    };
  }
  if (colors.includes('R') && colors.includes('G')) {
    return {
      borderGlow: 'hover:border-orange-400/80 hover:shadow-[0_0_24px_rgba(251,146,60,0.25)]',
      ambientBg: 'from-orange-600/20 via-emerald-600/15 to-transparent',
      accentPipText: 'text-orange-300'
    };
  }
  if (colors.includes('R') && colors.includes('W')) {
    return {
      borderGlow: 'hover:border-rose-400/80 hover:shadow-[0_0_24px_rgba(251,113,133,0.25)]',
      ambientBg: 'from-rose-500/20 via-amber-300/15 to-transparent',
      accentPipText: 'text-rose-200'
    };
  }
  if (colors.includes('G') && colors.includes('U')) {
    return {
      borderGlow: 'hover:border-teal-400/80 hover:shadow-[0_0_24px_rgba(45,212,191,0.25)]',
      ambientBg: 'from-teal-500/20 via-sky-500/15 to-transparent',
      accentPipText: 'text-teal-300'
    };
  }
  // Single Colors
  if (colors.includes('W')) return { borderGlow: 'hover:border-amber-200/80 hover:shadow-[0_0_24px_rgba(254,240,138,0.2)]', ambientBg: 'from-amber-200/15 to-transparent', accentPipText: 'text-amber-200' };
  if (colors.includes('U')) return { borderGlow: 'hover:border-sky-400/80 hover:shadow-[0_0_24px_rgba(56,189,248,0.25)]', ambientBg: 'from-sky-500/20 to-transparent', accentPipText: 'text-sky-300' };
  if (colors.includes('B')) return { borderGlow: 'hover:border-purple-500/80 hover:shadow-[0_0_24px_rgba(168,85,247,0.25)]', ambientBg: 'from-purple-900/30 to-transparent', accentPipText: 'text-purple-300' };
  if (colors.includes('R')) return { borderGlow: 'hover:border-orange-500/80 hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]', ambientBg: 'from-orange-600/25 to-transparent', accentPipText: 'text-orange-300' };
  if (colors.includes('G')) return { borderGlow: 'hover:border-emerald-400/80 hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]', ambientBg: 'from-emerald-500/20 to-transparent', accentPipText: 'text-emerald-300' };

  return { borderGlow: 'hover:border-amber-400/70', ambientBg: 'from-amber-500/15 to-transparent', accentPipText: 'text-amber-300' };
};

export const MyDecksView: React.FC<MyDecksViewProps> = ({
  savedDecks,
  activeDeckId,
  onLoadDeck,
  onCreateNewDeck,
  onDeleteDeck,
  onDuplicateDeck,
  onRenameDeck,
  onOpenImportModal,
  onOpenSync,
  onOpenNewDeckModal,
  onOpenCommanderFinder,
  userCollection
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'imported'>('all');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<'all' | 'brawl' | 'standard' | 'historic' | 'timeless' | 'explorer'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const customDecks = savedDecks.filter(d => !d.isImported);
  const importedDecks = savedDecks.filter(d => d.isImported);
  const hasEmptyImportedDecks = savedDecks.some(d => d.isImported && d.mainboard.length === 0);

  const baseDecks = activeTab === 'all'
    ? savedDecks
    : activeTab === 'custom'
      ? customDecks
      : importedDecks;

  const filteredDecks = baseDecks.filter(d => {
    if (filterFormat !== 'all' && d.format !== filterFormat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = d.name.toLowerCase().includes(q);
      const matchCommander = d.commander?.card.name.toLowerCase().includes(q);
      const matchTile = d.deckTileCard?.name.toLowerCase().includes(q);
      return matchName || matchCommander || matchTile;
    }
    return true;
  });

  const handleStartRename = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeckId(deck.id);
    setEditName(deck.name);
  };

  const handleSaveRename = (deckId: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editName.trim()) {
      onRenameDeck(deckId, editName.trim());
    }
    setEditingDeckId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="arena-panel rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <FolderHeart className="w-4 h-4" />
            </div>
            <h2 className="font-fantasy font-black text-xl text-white flex items-center gap-2">
              <span>My Decks</span>
              <span className="text-xs bg-orange-950/80 text-orange-300 font-bold px-2.5 py-0.5 rounded-full border border-orange-500/40">
                {savedDecks.length} {savedDecks.length === 1 ? 'Deck' : 'Decks'}
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Manage your personal brews and MTG Arena imported lists. Click any deck card or <strong>Load into Builder</strong> to edit or playtest.
          </p>
        </div>

        {/* Action Controls: Sync, Import Deck & New Brew */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenSync && (
            <button
              onClick={onOpenSync}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#141a29] hover:bg-[#1c2438] text-amber-300 border border-amber-500/40 rounded-xl transition shadow-sm hover:border-amber-400"
              title="Sync all decks and card collection from MTG Arena Player.log"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync Arena Account</span>
            </button>
          )}

          {onOpenCommanderFinder && (
            <button
              onClick={onOpenCommanderFinder}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#141a29] hover:bg-[#1c2438] text-amber-300 border border-amber-500/40 rounded-xl transition shadow-sm hover:border-amber-400"
              title="Discover a new Brawl commander on MTG Arena by color & strategy"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Find a Commander</span>
            </button>
          )}

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#141a29] hover:bg-[#1c2438] text-amber-300 border border-amber-500/40 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Deck</span>
          </button>

          <button
            onClick={() => onOpenNewDeckModal ? onOpenNewDeckModal() : onCreateNewDeck('brawl')}
            className="btn-mythic-spark flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition shadow-md hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deck</span>
          </button>
        </div>
      </div>

      {/* Empty Imported Decks Warning & Quick Sync Banner */}
      {hasEmptyImportedDecks && onOpenSync && (
        <div className="bg-gradient-to-r from-amber-950/70 via-stone-900/80 to-amber-950/70 border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">Imported Decks Need Card Synchronization</h4>
              <p className="text-xs text-amber-300/80 mt-0.5 max-w-2xl leading-relaxed">
                Some imported decks in your library currently only show the commander. Sync with MTG Arena to automatically populate all 100-card decklists and categorize them for the deck builder.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSync}
            className="btn-mythic-spark flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition shadow-lg whitespace-nowrap flex-shrink-0 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Arena Decks Now</span>
          </button>
        </div>
      )}

      {/* Sub-Navigation: Tabs + Search + Format Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        {/* Main Tab Toggle: All vs Custom Brews vs Imported Decks */}
        <div className="flex items-center bg-[#0d1017]/90 p-1 rounded-2xl border border-white/10 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-stone-800 text-stone-400'
            }`}>
              {savedDecks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'custom'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Brews</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'custom' ? 'bg-slate-950/20 text-slate-950' : 'bg-stone-800 text-stone-400'
            }`}>
              {customDecks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('imported')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'imported'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <CloudDownload className="w-3.5 h-3.5" />
            <span>Imported Decks</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'imported' ? 'bg-slate-950/20 text-slate-950' : 'bg-stone-800 text-stone-400'
            }`}>
              {importedDecks.length}
            </span>
          </button>
        </div>

        {/* Right Controls: Search bar + Format filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search decks or cards..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1017] border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400/70 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Format Filter Pills */}
          <div className="flex items-center flex-wrap gap-1 bg-[#0d1017]/90 p-1 rounded-xl border border-white/5">
            {(['all', 'brawl', 'standard', 'historic', 'timeless'] as const).map(f => {
              const count = f === 'all' 
                ? baseDecks.length 
                : baseDecks.filter(d => d.format === f).length;

              return (
                <button
                  key={f}
                  onClick={() => setFilterFormat(f)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold capitalize transition flex items-center gap-1.5 ${
                    filterFormat === f
                      ? 'btn-mythic-spark shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                  }`}
                >
                  <span>{f}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filterFormat === f ? 'bg-slate-950/30 text-slate-950' : 'bg-white/5 text-stone-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="arena-panel rounded-3xl p-12 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-fantasy font-bold text-base text-white">
            {searchQuery ? `No decks matching "${searchQuery}"` : activeTab === 'all'
              ? 'No decks found'
              : activeTab === 'custom'
                ? 'No custom brews found'
                : 'No imported decks yet'}
          </h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            {searchQuery
              ? 'Try searching with a different keyword or clear the search input.'
              : activeTab === 'all'
                ? 'Start building a new deck from scratch or import your decklists from MTG Arena.'
                : activeTab === 'custom'
                  ? 'Start building a new deck from scratch or duplicate an imported deck to make it your own.'
                  : 'Paste an MTG Arena export via "Import Deck" or use "Sync Arena Account" to pull decks from Player.log.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition"
              >
                Clear Search Filter
              </button>
            ) : activeTab === 'imported' ? (
              <button
                onClick={onOpenImportModal}
                className="btn-mythic-spark inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Import Deck from MTG Arena</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onCreateNewDeck('brawl')}
                  className="btn-mythic-spark inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Brawl Deck</span>
                </button>
                {onOpenCommanderFinder && (
                  <button
                    onClick={onOpenCommanderFinder}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#141a29] hover:bg-[#1c2438] text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl transition shadow-sm hover:border-amber-400"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Find a Commander</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map(deck => {
            const isActive = deck.id === activeDeckId;
            const commander = deck.commander?.card;
            const heroCard = commander || deck.deckTileCard || deck.mainboard.find(c => c.card.rarity === 'mythic')?.card || deck.mainboard[0]?.card;
            const isBrawl = deck.format === 'brawl';

            const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);
            const totalCount = mainCount + (commander ? 1 : 0);
            const targetCount = isBrawl ? 100 : 60;
            const isComplete = totalCount === targetCount;
            const completionPercent = Math.min(100, Math.round((totalCount / targetCount) * 100));

            const colors = getDeckColors(deck);
            const colorTheme = getDeckColorTheme(colors);
            const colorPipsStr = colors.length > 0 ? colors.map(c => `{${c}}`).join('') : '{C}';

            const formatBadgeColors: Record<string, string> = {
              brawl: 'bg-gradient-to-r from-orange-600 to-amber-600 text-slate-950 border-amber-300/40',
              standard: 'bg-blue-950/90 text-blue-300 border-blue-500/50',
              historic: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
              timeless: 'bg-purple-950/90 text-purple-300 border-purple-500/50',
              explorer: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
              alchemy: 'bg-rose-950/90 text-rose-300 border-rose-500/50'
            };

            return (
              <div
                key={deck.id}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xl bg-[#121622] border ${
                  isActive
                    ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_28px_rgba(245,158,11,0.3)]'
                    : `border-[#c5a059]/25 ${colorTheme.borderGlow} hover:-translate-y-1 hover:shadow-2xl`
                }`}
              >
                {/* 1. HERO ART BANNER (High-impact Commander landscape showcase) */}
                <div 
                  className="relative h-44 sm:h-48 w-full overflow-hidden bg-black/80 cursor-pointer select-none"
                  onClick={() => onLoadDeck(deck)}
                  title={`Click to load ${deck.name} into builder`}
                >
                  {/* High Definition Scryfall Art Crop */}
                  {heroCard?.imageUrl ? (
                    <CardImage
                      src={heroCard.imageUrl}
                      cardName={heroCard.name}
                      alt={heroCard.name}
                      artCrop={true}
                      className="w-full h-full object-cover object-top filter brightness-95 group-hover:brightness-105 group-hover:scale-108 transition-all duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 flex items-center justify-center">
                      <div className="text-stone-600 flex flex-col items-center">
                        <Layers className="w-10 h-10 opacity-40 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Constructed Deck</span>
                      </div>
                    </div>
                  )}

                  {/* Gradient Scrims: Top vignette for badges, bottom fade for commander altar */}
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#121622] via-[#121622]/85 to-transparent pointer-events-none" />

                  {/* Ambient Color Identity Aura */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${colorTheme.ambientBg} opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none`} />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                    {/* Left Badges: Format & Sync */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-md flex items-center gap-1 ${formatBadgeColors[deck.format] || 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                        {isBrawl && <Crown className="w-3 h-3 text-slate-950" />}
                        <span>{deck.format}</span>
                      </span>

                      {deck.isImported ? (
                        <span className="text-[9.5px] font-bold bg-purple-950/80 backdrop-blur-md text-purple-200 border border-purple-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <CloudDownload className="w-2.5 h-2.5 text-purple-300" />
                          <span>Arena Synced</span>
                        </span>
                      ) : activeTab === 'all' ? (
                        <span className="text-[9.5px] font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                          <span>Custom Brew</span>
                        </span>
                      ) : null}

                      {isActive && (
                        <span className="text-[9.5px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md font-sans">
                          <Zap className="w-2.5 h-2.5 fill-slate-950" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    {/* Right Badge: Card Count & Completion */}
                    <div>
                      {isComplete ? (
                        <span className="text-[10px] font-bold bg-emerald-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{totalCount}/{targetCount}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-amber-200 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-md">
                          {totalCount}/{targetCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Altar: Floating Commander or Hero Card Details */}
                  {heroCard && (
                    <div className="absolute bottom-2.5 inset-x-3.5 z-10 flex items-center justify-between gap-2 pointer-events-none">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Miniature Card Portrait with Gold Filigree Border */}
                        {heroCard.imageUrl && (
                          <div className={`relative flex-shrink-0 w-10 h-13 rounded-lg overflow-hidden shadow-xl border-2 transition-transform group-hover:scale-105 ${
                            isBrawl ? 'border-amber-400 ring-1 ring-amber-300/50' : 'border-sky-400/80'
                          }`}>
                            <CardImage
                              src={heroCard.imageUrl}
                              cardName={heroCard.name}
                              alt={heroCard.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Title & Mana Pips */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider">
                            {isBrawl ? (
                              <span className="text-amber-400 flex items-center gap-1 drop-shadow-sm font-extrabold">
                                <Crown className="w-3 h-3 text-amber-400" /> Commander
                              </span>
                            ) : (
                              <span className="text-sky-300 flex items-center gap-1 drop-shadow-sm font-extrabold">
                                <Layers className="w-3 h-3 text-sky-400" /> Key Card
                              </span>
                            )}
                          </div>
                          <span 
                            className="font-fantasy font-black text-sm text-white block truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" 
                            title={heroCard.name}
                          >
                            {heroCard.name}
                          </span>
                        </div>
                      </div>

                      {/* Mana Cost */}
                      {heroCard.manaCost && (
                        <div className="flex-shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          <ManaCost manaCost={heroCard.manaCost} size="sm" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. CARD BODY & DECK INFO */}
                <div className="p-4 sm:p-5 pt-3 flex flex-col justify-between flex-1 space-y-3.5 bg-[#121622]">
                  <div className="space-y-2">
                    {/* Deck Title or Editable Name Form */}
                    {editingDeckId === deck.id ? (
                      <form onSubmit={e => handleSaveRename(deck.id, e)} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 bg-[#090c12] border border-amber-400 rounded-xl px-2.5 py-1 text-sm font-bold text-white focus:outline-none shadow-inner"
                        />
                        <button
                          type="submit"
                          className="p-1.5 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition shadow-sm"
                          title="Save deck name"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <h3 
                          onClick={() => onLoadDeck(deck)}
                          className="font-fantasy font-extrabold text-base sm:text-lg text-white truncate group-hover:text-amber-300 transition cursor-pointer"
                          title={deck.name}
                        >
                          {deck.name}
                        </h3>
                        <button
                          onClick={e => handleStartRename(deck, e)}
                          className="text-stone-400 hover:text-amber-300 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-white/5"
                          title="Rename deck"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Color Identity Pips & Meta Row */}
                    <div className="flex items-center justify-between text-xs text-stone-400 gap-2 flex-wrap">
                      {/* Mana Identity */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Identity:</span>
                        <ManaCost manaCost={colorPipsStr} size="sm" />
                      </div>

                      {/* Updated Date */}
                      <div className="flex items-center gap-1 text-[11px] text-stone-400">
                        <Calendar className="w-3 h-3 text-stone-500" />
                        <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Empty Imported Deck Notice or Progress Bar */}
                    {deck.isImported && deck.mainboard.length === 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-[11px] font-semibold truncate">Only Commander Loaded (0/99)</span>
                        </div>
                        {onOpenSync && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSync();
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-200 underline font-bold whitespace-nowrap"
                          >
                            Sync Deck
                          </button>
                        )}
                      </div>
                    ) : !isComplete ? (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-amber-400/90 font-medium">Work in Progress</span>
                          <span className="text-stone-400 font-mono">{completionPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-300" 
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* 3. CARD FOOTER: Actions & Load CTA */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    {/* Utility Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onDuplicateDeck(deck)}
                        className="p-2 text-stone-400 hover:text-amber-300 hover:bg-white/5 rounded-xl transition border border-transparent hover:border-amber-500/20"
                        title={deck.isImported ? "Duplicate to Custom Brews" : "Duplicate deck"}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteDeck(deck.id)}
                        className="p-2 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition border border-transparent hover:border-rose-500/20"
                        title="Delete deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Main "Load into Builder" CTA */}
                    <button
                      onClick={() => onLoadDeck(deck)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md ${
                        isActive
                          ? 'bg-[#1e2538] text-amber-300 border border-amber-500/60 hover:bg-[#273048]'
                          : 'btn-mythic-spark hover:scale-103'
                      }`}
                    >
                      <span>{isActive ? 'Continue Building' : 'Load into Builder'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDecksView;

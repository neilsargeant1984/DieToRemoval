import React, { useState } from 'react';
import { Deck } from '../types/deck';
import { FormatType } from '../types/card';
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
  FileCode2
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
  userCollection: UserCollection;
}

export const MyDecksView: React.FC<MyDecksViewProps> = ({
  savedDecks,
  activeDeckId,
  onLoadDeck,
  onCreateNewDeck,
  onDeleteDeck,
  onDuplicateDeck,
  onRenameDeck,
  onOpenImportModal,
  userCollection
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'imported'>('all');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<'all' | 'brawl' | 'standard' | 'historic' | 'timeless' | 'explorer'>('all');

  const customDecks = savedDecks.filter(d => !d.isImported);
  const importedDecks = savedDecks.filter(d => d.isImported);

  const baseDecks = activeTab === 'all'
    ? savedDecks
    : activeTab === 'custom'
      ? customDecks
      : importedDecks;

  const filteredDecks = baseDecks.filter(d => {
    if (filterFormat === 'all') return true;
    return d.format === filterFormat;
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
            Manage your personal brews and MTG Arena imported lists. Click <strong>Load into Builder</strong> to edit or playtest.
          </p>
        </div>

        {/* Action Controls: Import Deck & New Brew */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#141a29] hover:bg-[#1c2438] text-amber-300 border border-amber-500/40 rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Deck</span>
          </button>

          <button
            onClick={() => onCreateNewDeck('brawl')}
            className="btn-mythic-spark flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition shadow-md hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Brawl Deck</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation: Tabs (All vs Custom Brews vs Imported Decks) + Format Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        {/* Main Tab Toggle: All vs Custom Brews vs Imported Decks */}
        <div className="flex items-center bg-[#0d1017]/90 p-1 rounded-2xl border border-white/10 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
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
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
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
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
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
                className={`text-xs px-3 py-1 rounded-lg font-bold capitalize transition flex items-center gap-1.5 ${
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

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="arena-panel rounded-3xl p-12 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-fantasy font-bold text-base text-white">
            {activeTab === 'all'
              ? 'No decks found'
              : activeTab === 'custom'
                ? 'No custom brews found'
                : 'No imported decks yet'}
          </h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            {activeTab === 'all'
              ? 'Start building a new deck from scratch or import your decklists from MTG Arena.'
              : activeTab === 'custom'
                ? 'Start building a new deck from scratch or duplicate an imported deck to make it your own.'
                : 'Paste an MTG Arena export via "Import Deck" or use "Sync Arena Account" to pull decks from Player.log.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {activeTab === 'imported' ? (
              <button
                onClick={onOpenImportModal}
                className="btn-mythic-spark inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Import Deck from MTG Arena</span>
              </button>
            ) : (
              <button
                onClick={() => onCreateNewDeck('brawl')}
                className="btn-mythic-spark inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Brawl Deck</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDecks.map(deck => {
            const isActive = deck.id === activeDeckId;
            const commander = deck.commander?.card;
            const mainCount = deck.mainboard.reduce((a, b) => a + b.quantity, 0);
            const totalCount = mainCount + (commander ? 1 : 0);
            const targetCount = deck.format === 'brawl' ? 100 : 60;
            const isComplete = totalCount === targetCount;

            const formatBadgeColors: Record<string, string> = {
              brawl: 'bg-orange-950 text-orange-300 border-orange-700',
              standard: 'bg-blue-950 text-blue-300 border-blue-700',
              historic: 'bg-emerald-950 text-emerald-300 border-emerald-700',
              timeless: 'bg-purple-950 text-purple-300 border-purple-700',
              explorer: 'bg-amber-950 text-amber-300 border-amber-700',
              alchemy: 'bg-rose-950 text-rose-300 border-rose-700'
            };

            return (
              <div
                key={deck.id}
                className={`group relative arena-panel rounded-2xl p-5 transition flex flex-col justify-between space-y-4 hover:shadow-2xl ${
                  isActive
                    ? 'border-amber-500 ring-2 ring-amber-400/80 shadow-xl bg-[#182030]'
                    : 'hover:border-amber-400/60'
                }`}
              >
                {/* Top Row: Format & Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border capitalize ${formatBadgeColors[deck.format] || 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                        {deck.format}
                      </span>
                      {deck.isImported ? (
                        <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <CloudDownload className="w-2.5 h-2.5" />
                          <span>Arena Synced</span>
                        </span>
                      ) : activeTab === 'all' ? (
                        <span className="text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Custom Brew</span>
                        </span>
                      ) : null}
                      {isActive && (
                        <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-sans">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Active in Builder</span>
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-mono font-bold ${
                      isComplete ? 'text-emerald-400' : 'text-stone-400'
                    }`}>
                      {totalCount}/{targetCount} cards
                    </span>
                  </div>

                  {/* Deck Title or Rename Input */}
                  {editingDeckId === deck.id ? (
                    <form onSubmit={e => handleSaveRename(deck.id, e)} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                        className="flex-1 bg-[#0d1017] border border-amber-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none shadow-sm"
                      />
                      <button
                        type="submit"
                        className="p-1 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-fantasy font-bold text-base text-white truncate group-hover:text-amber-300 transition">
                        {deck.name}
                      </h3>
                      <button
                        onClick={e => handleStartRename(deck, e)}
                        className="text-stone-400 hover:text-stone-200 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        title="Rename deck"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hero Card Banner: Commander (Brawl) or Featured Card / Deck Tile (Standard/Historic) */}
                  {(() => {
                    const heroCard = commander || deck.deckTileCard || deck.mainboard[0]?.card;
                    const isBrawl = deck.format === 'brawl';
                    
                    if (heroCard) {
                      return (
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1017] p-2.5 shadow-inner group-hover:border-amber-500/40 transition">
                          {/* Ambient Art Background Glow */}
                          {heroCard.imageUrl && (
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-15 blur-sm scale-110 pointer-events-none"
                              style={{ backgroundImage: `url(${heroCard.imageUrl})` }}
                            />
                          )}
                          <div className="relative z-10 flex items-center gap-3">
                            {heroCard.imageUrl && (
                              <CardImage
                                src={heroCard.imageUrl}
                                cardName={heroCard.name}
                                alt={heroCard.name}
                                className={`w-11 h-15 object-cover rounded-lg shadow-md flex-shrink-0 transition-transform group-hover:scale-105 ${
                                  isBrawl ? 'border border-[#d4af37]/70' : 'border border-blue-400/50'
                                }`}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                {isBrawl ? (
                                  <>
                                    <Crown className="w-3 h-3 text-amber-400" />
                                    <span className="text-amber-400 font-extrabold">Commander</span>
                                  </>
                                ) : (
                                  <>
                                    <Layers className="w-3 h-3 text-blue-400" />
                                    <span className="text-blue-300 font-extrabold">Featured Card</span>
                                  </>
                                )}
                              </div>
                              <span className="font-bold text-xs text-white block truncate mt-0.5" title={heroCard.name}>
                                {heroCard.name}
                              </span>
                              {heroCard.manaCost && (
                                <div className="mt-1">
                                  <ManaCost manaCost={heroCard.manaCost} size="sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-[#0d1017] p-3 rounded-xl border border-white/5 text-[11px] text-stone-400 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-stone-500" />
                        <span>Constructed 60-card list</span>
                      </div>
                    );
                  })()}

                  {/* Date Stamp */}
                  <div className="flex items-center gap-1.5 text-[10.5px] text-stone-400">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateDeck(deck)}
                      className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-white/5 rounded-lg transition"
                      title={deck.isImported ? "Duplicate to Custom Brews" : "Duplicate deck"}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDeck(deck.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Load into Builder Button */}
                  <button
                    onClick={() => onLoadDeck(deck)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      isActive
                        ? 'bg-[#1e2538] text-amber-300 border border-amber-500/50 hover:bg-[#252e46]'
                        : 'btn-mythic-spark hover:scale-[1.02]'
                    }`}
                  >
                    <span>{isActive ? 'Continue Building' : 'Load into Builder'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
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

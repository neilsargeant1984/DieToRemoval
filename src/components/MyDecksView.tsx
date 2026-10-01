import React, { useState } from 'react';
import { Deck } from '../types/deck';
import { FormatType } from '../types/card';
import { UserCollection } from '../types/collection';
import { ManaCost } from './ManaCost';
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  Play, 
  Copy, 
  Calendar, 
  Layers, 
  Crown, 
  ExternalLink,
  Edit2,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface MyDecksViewProps {
  savedDecks: Deck[];
  activeDeckId?: string;
  onLoadDeck: (deck: Deck) => void;
  onCreateNewDeck: (format: FormatType) => void;
  onDeleteDeck: (deckId: string) => void;
  onDuplicateDeck: (deck: Deck) => void;
  onRenameDeck: (deckId: string, newName: string) => void;
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
  userCollection
}) => {
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<'all' | 'brawl' | 'standard' | 'historic' | 'timeless' | 'explorer'>('all');

  const filteredDecks = savedDecks.filter(d => {
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
      <div className="bg-[#121622]/90 border border-[#232b3d] rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FolderHeart className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <span>My Decks</span>
              <span className="text-xs bg-[#1a2130] text-amber-300 font-bold px-2 py-0.5 rounded-full border border-[#2c3750]">
                {savedDecks.length} {savedDecks.length === 1 ? 'Deck' : 'Decks'}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal MTG Arena brews. Click <strong>Load into Builder</strong> to edit or playtest any deck.
          </p>
        </div>

        {/* Action Controls: New Deck & Format Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Tabs */}
          <div className="flex items-center bg-[#0d1017] p-1 rounded-xl border border-[#22293a]">
            {(['all', 'brawl', 'standard', 'historic', 'timeless'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterFormat(f)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                  filterFormat === f
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Create New Deck Dropdown Buttons */}
          <button
            onClick={() => onCreateNewDeck('brawl')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-md hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Brawl Deck</span>
          </button>
        </div>
      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="bg-[#121622]/60 border border-[#232b3d] rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No saved decks in this view</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You can start a new deck from scratch or continue working on your active deck list.
          </p>
          <button
            onClick={() => onCreateNewDeck('brawl')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Brawl Deck</span>
          </button>
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
              brawl: 'bg-amber-950/70 text-amber-300 border-amber-800/80',
              standard: 'bg-blue-950/70 text-blue-300 border-blue-800/80',
              pioneer: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
            };

            return (
              <div
                key={deck.id}
                className={`group relative bg-[#131722] border rounded-2xl p-4.5 transition flex flex-col justify-between space-y-4 hover:shadow-2xl ${
                  isActive
                    ? 'border-amber-400/80 shadow-amber-500/10 bg-[#161c2b]'
                    : 'border-[#232b3d] hover:border-slate-600'
                }`}
              >
                {/* Top Row: Format & Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border capitalize ${formatBadgeColors[deck.format] || 'bg-slate-800 text-slate-300'}`}>
                        {deck.format}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Active in Builder</span>
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-mono font-bold ${
                      isComplete ? 'text-emerald-400' : 'text-slate-400'
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
                        className="flex-1 bg-[#0d1017] border border-amber-500/50 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-100 focus:outline-none"
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
                      <h3 className="text-base font-extrabold text-slate-100 truncate group-hover:text-amber-300 transition">
                        {deck.name}
                      </h3>
                      <button
                        onClick={e => handleStartRename(deck, e)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        title="Rename deck"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Commander / Lead Card Feature Banner */}
                  {commander ? (
                    <div className="flex items-center gap-3 bg-[#0c1017] p-2.5 rounded-xl border border-[#202738]">
                      {commander.imageUrl && (
                        <img
                          src={commander.imageUrl}
                          alt={commander.name}
                          className="w-10 h-14 object-cover rounded-lg border border-[#2c364d] shadow-sm flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Commander</span>
                        </div>
                        <span className="font-bold text-xs text-slate-200 block truncate mt-0.5">
                          {commander.name}
                        </span>
                        <div className="mt-1">
                          <ManaCost manaCost={commander.manaCost} size="sm" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#0c1017]/50 p-2.5 rounded-xl border border-[#1f2638] text-[11px] text-slate-500 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>Standard 60-card constructed list</span>
                    </div>
                  )}

                  {/* Date Stamp */}
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[#1f2638] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateDeck(deck)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a2130] rounded-lg transition"
                      title="Duplicate deck"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDeck(deck.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Load into Builder Button */}
                  <button
                    onClick={() => onLoadDeck(deck)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
                      isActive
                        ? 'bg-[#1b2333] text-amber-300 border border-amber-500/40 hover:bg-[#232c40]'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-[1.02]'
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

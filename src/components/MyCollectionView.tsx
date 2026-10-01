import React, { useState, useMemo } from 'react';
import { Card, CardRarity, CardTypeCategory, FormatType } from '../types/card';
import { UserCollection, WildcardInventory } from '../types/collection';
import { ARENA_CARDS } from '../data/arenaCards';
import { CardImage } from './CardImage';
import { 
  Sparkles, 
  Search, 
  UploadCloud, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Filter, 
  X,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

interface MyCollectionViewProps {
  userCollection: UserCollection;
  wildcardInventory: WildcardInventory;
  onSelectCardDetail: (card: Card) => void;
  onAddCardToDeck: (card: Card) => void;
  onOpenSync: () => void;
}

export const MyCollectionView: React.FC<MyCollectionViewProps> = ({
  userCollection,
  wildcardInventory,
  onSelectCardDetail,
  onAddCardToDeck,
  onOpenSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all_owned' | 'playsets' | 'incomplete' | 'unowned'>('all_owned');
  const [selectedFormat, setSelectedFormat] = useState<FormatType | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | null>(null);

  // Compute collection statistics
  const stats = useMemo(() => {
    let totalUniqueOwned = 0;
    let totalCardsOwned = 0;
    let playsetCount = 0;
    let incompleteCount = 0;

    for (const card of ARENA_CARDS) {
      const count = userCollection[card.arenaId] || 0;
      if (count > 0) {
        totalUniqueOwned++;
        totalCardsOwned += count;
        if (count >= 4) {
          playsetCount++;
        } else {
          incompleteCount++;
        }
      }
    }

    return {
      totalUniqueOwned,
      totalCardsOwned,
      playsetCount,
      incompleteCount
    };
  }, [userCollection]);

  // Filter cards based on current settings
  const filteredCards = useMemo(() => {
    return ARENA_CARDS.filter(card => {
      const owned = userCollection[card.arenaId] || 0;

      // Ownership filter
      if (ownershipFilter === 'all_owned' && owned === 0) return false;
      if (ownershipFilter === 'playsets' && owned < 4) return false;
      if (ownershipFilter === 'incomplete' && (owned === 0 || owned >= 4)) return false;
      if (ownershipFilter === 'unowned' && owned > 0) return false;

      // Format filter
      if (selectedFormat !== 'all') {
        if (!card.legalities || !card.legalities[selectedFormat]) return false;
      }

      // Color filter
      if (selectedColor) {
        if (selectedColor === 'C' && card.colors.length > 0) return false;
        if (selectedColor === 'M' && card.colors.length < 2) return false;
        if (!['C', 'M'].includes(selectedColor) && !card.colors.includes(selectedColor as any)) return false;
      }

      // Rarity filter
      if (selectedRarity && card.rarity !== selectedRarity) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!card.name.toLowerCase().includes(q) && !card.oracleText.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [userCollection, ownershipFilter, selectedFormat, selectedColor, selectedRarity, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="sanctum-panel rounded-3xl p-6 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="font-fantasy font-black text-xl text-stone-900 flex items-center gap-2">
                <span>My MTG Arena Collection</span>
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Browse all cards in your personal collection, track playsets, and inspect Arena ownership.
            </p>
          </div>

          <button
            onClick={onOpenSync}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm border border-amber-300/60 transition self-start md:self-auto"
          >
            <UploadCloud className="w-4 h-4 text-slate-950" />
            <span>Sync Arena Account</span>
          </button>
        </div>

        {/* Collection Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Unique Cards Owned
            </span>
            <div className="text-xl font-fantasy font-black text-stone-900 mt-0.5">
              {stats.totalUniqueOwned}
            </div>
          </div>

          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Total Cards in Vault
            </span>
            <div className="text-xl font-fantasy font-black text-amber-800 mt-0.5">
              {stats.totalCardsOwned}
            </div>
          </div>

          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Full Playsets (4x)
            </span>
            <div className="text-xl font-fantasy font-black text-emerald-800 mt-0.5">
              {stats.playsetCount}
            </div>
          </div>

          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-3.5 shadow-sm">
            <span className="text-[10px] font-fantasy font-bold text-stone-500 uppercase tracking-wider block">
              Wildcards Available
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-bold">
              <span className="text-amber-800" title="Rare">{wildcardInventory.rare}R</span>
              <span className="text-orange-700" title="Mythic">{wildcardInventory.mythic}M</span>
              <span className="text-stone-600" title="Uncommon">{wildcardInventory.uncommon}U</span>
              <span className="text-stone-500" title="Common">{wildcardInventory.common}C</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by card name, oracle text, or creature type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#e5d8b8] rounded-xl pl-11 pr-10 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
          <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ownership Status & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5d8b8] text-xs">
          {/* Ownership Filter Pills */}
          <div className="flex items-center bg-[#ede7d8] p-1 rounded-full border border-[#dfd4be] shadow-inner gap-1">
            {[
              { id: 'all_owned', label: `Owned (${stats.totalUniqueOwned})` },
              { id: 'playsets', label: `Playsets 4x (${stats.playsetCount})` },
              { id: 'incomplete', label: `Incomplete (<4x)` },
              { id: 'unowned', label: `Unowned (0x)` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setOwnershipFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full font-bold transition text-xs ${
                  ownershipFilter === tab.id
                    ? 'bg-white text-stone-900 shadow-sm border border-amber-500/40'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Color Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-fantasy font-bold text-stone-600 uppercase mr-1">Colors:</span>
            {[
              { id: 'W', label: 'W', bg: 'bg-amber-100 text-amber-950 border-amber-300' },
              { id: 'U', label: 'U', bg: 'bg-blue-600 text-white border-blue-400' },
              { id: 'B', label: 'B', bg: 'bg-neutral-800 text-neutral-200 border-neutral-600' },
              { id: 'R', label: 'R', bg: 'bg-red-600 text-white border-red-400' },
              { id: 'G', label: 'G', bg: 'bg-emerald-600 text-white border-emerald-400' },
              { id: 'C', label: 'Colorless', bg: 'bg-slate-700 text-slate-200 border-slate-500' },
              { id: 'M', label: 'Multi', bg: 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 text-white border-transparent' }
            ].map(c => {
              const isSelected = selectedColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(isSelected ? null : c.id)}
                  className={`px-2 py-0.5 rounded text-xs font-bold border transition ${
                    isSelected
                      ? `${c.bg} ring-2 ring-amber-500 ring-offset-1 ring-offset-white scale-105 shadow-sm`
                      : 'bg-white text-stone-600 border-[#e5d8b8] hover:border-amber-400'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Grid with Ownership Pips */}
      <div className="min-h-[460px]">
        {filteredCards.length === 0 ? (
          <div className="sanctum-panel rounded-3xl p-12 text-center text-stone-500 space-y-3">
            <PackageCheck className="w-12 h-12 mx-auto text-stone-400" />
            <h3 className="font-fantasy font-bold text-stone-800 text-base">No cards found in this view</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Try adjusting your ownership filter or search keywords. You can also click <strong>Sync Arena Account</strong> to load your cards from MTG Arena!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredCards.map(card => {
              const ownedCount = userCollection[card.arenaId] || 0;
              const isPlayset = ownedCount >= 4;

              return (
                <div
                  key={card.id}
                  className="card-item group rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer p-2.5 relative"
                  onClick={() => onSelectCardDetail(card)}
                >
                  <div className="relative overflow-hidden rounded-xl shadow border border-black/30 mb-2 bg-black">
                    <CardImage
                      src={card.imageUrl}
                      cardName={card.name}
                      alt={card.name}
                      className="w-full h-auto object-cover group-hover:brightness-105 transition"
                    />

                    {/* Ownership badge overlay */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-md border ${
                        isPlayset
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : ownedCount > 0
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-stone-800/90 text-stone-300 border-stone-600'
                      }`}>
                        {ownedCount}/4 {isPlayset ? 'Playset' : 'Owned'}
                      </span>
                    </div>

                    {/* 4 Ownership Pips */}
                    <div className="absolute bottom-1.5 left-0 right-0 flex justify-center items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm mx-3 rounded-full">
                      {[1, 2, 3, 4].map(pip => (
                        <div
                          key={pip}
                          className={`w-2 h-2 rounded-full transition ${
                            ownedCount >= pip
                              ? 'bg-amber-400 ring-1 ring-amber-200 shadow-sm shadow-amber-400'
                              : 'bg-stone-600/70'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card Title & Add Action */}
                  <div className="p-1 flex items-center justify-between gap-2 border-t border-[#e8dfc8]">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-stone-900 truncate block group-hover:text-amber-800">
                        {card.name}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono capitalize">
                        {card.rarity}
                      </span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onAddCardToDeck(card);
                      }}
                      className="p-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-200 text-slate-950 rounded-lg transition shadow-sm border border-amber-300/60"
                      title="Add to active deck"
                    >
                      <Plus className="w-3.5 h-3.5 font-bold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCollectionView;

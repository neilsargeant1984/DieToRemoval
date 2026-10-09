import React from 'react';
import { FormatType } from '../types/card';
import { WildcardInventory } from '../types/collection';
import { 
  Sparkles, 
  BookOpen, 
  Layers, 
  UploadCloud, 
  Download, 
  Crown,
  FolderHeart,
  ShieldCheck,
  User,
  LogOut,
  Cloud,
  Home,
  Swords
} from 'lucide-react';

export type MainNavTab = 'home' | 'deck_builder' | 'card_library' | 'my_decks';

interface ArenaNavbarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  currentFormat: FormatType;
  onSelectFormat: (format: FormatType) => void;
  inventory: WildcardInventory;
  onOpenSync: () => void;
  onOpenExport: () => void;
  onOpenImport?: () => void;
  hasCommander?: boolean;
  deckCount?: number;
  user?: any;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onOpenWildcards?: () => void;
  onOpenCommanderFinder?: () => void;
}

const FORMAT_OPTIONS: {
  id: FormatType;
  label: string;
  cardCount: string;
  isFlagship?: boolean;
}[] = [
  { id: 'brawl', label: 'Brawl', cardCount: '100', isFlagship: true },
  { id: 'standard', label: 'Standard', cardCount: '60' },
];

export const ArenaNavbar: React.FC<ArenaNavbarProps> = ({
  currentTab,
  onSelectTab,
  currentFormat,
  onSelectFormat,
  inventory,
  onOpenSync,
  onOpenExport,
  onOpenImport,
  hasCommander,
  deckCount = 0,
  user,
  onOpenAuth,
  onSignOut,
  onOpenWildcards,
  onOpenCommanderFinder
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0e121a]/95 border-b border-[#c5a059]/25 backdrop-blur-xl px-4 py-2.5 shadow-2xl">
      <div className="max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Brand & Top-level Navigation Pills */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-start w-full md:w-auto gap-3 sm:gap-6">
          {/* DieToRemoval Brand (Clickable to Home) */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            title="Go to Home"
            className="flex items-center gap-2.5 group cursor-pointer text-left transition hover:opacity-95 focus:outline-none flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-amber-600 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/25 border border-rose-300/40 group-hover:scale-105 transition-transform">
              <Crown className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-fantasy font-black text-sm tracking-wider text-white uppercase group-hover:text-amber-200 transition-colors">
                DIE<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-orange-400">TO</span>REMOVAL
              </span>
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-rose-950/80 text-rose-300 border border-rose-500/40">
                .GG
              </span>
            </div>
          </button>

          {/* Primary View Pills: Home vs Deck Builder vs Card Library vs My Collection vs My Decks */}
          <div className="flex items-center bg-[#0d1017]/90 p-1 rounded-xl border border-white/5 gap-1 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'home'
                  ? 'bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-rose-400" />
              <span>Home</span>
            </button>
            <button
              onClick={() => onSelectTab('deck_builder')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'deck_builder'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Deck Builder</span>
            </button>
            <button
              onClick={() => onSelectTab('card_library')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'card_library'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Card Library</span>
            </button>
            <button
              onClick={() => onSelectTab('my_decks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTab === 'my_decks'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5 text-amber-400" />
              <span>My Decks</span>
              {deckCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'my_decks' ? 'bg-amber-400 text-slate-950' : 'bg-stone-800 text-stone-300'
                }`}>
                  {deckCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right Section: Wildcard Quick Stash & Actions */}
        <div className="flex items-center gap-3">
          {/* Wildcard Gems Pill (Clickable) */}
          <button
            type="button"
            onClick={onOpenWildcards}
            className="hidden sm:flex items-center gap-2.5 bg-[#0d1017]/80 hover:bg-[#151a26] px-3 py-1.5 rounded-xl border border-white/5 hover:border-amber-500/30 text-xs shadow-inner transition cursor-pointer group"
            title="Click to view & edit your Wildcard Stash"
          >
            <Sparkles className="w-3 h-3 text-amber-400/80 group-hover:text-amber-400 transition" />
            <div className="flex items-center gap-1 text-[11px]" title="Common Wildcards">
              <div className="w-2 h-2 rounded-full bg-stone-400" />
              <span className="font-bold text-stone-300 font-mono group-hover:text-white transition">{inventory.common}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Uncommon Wildcards">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="font-bold text-cyan-200 font-mono group-hover:text-cyan-100 transition">{inventory.uncommon}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Rare Wildcards">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="font-bold text-amber-200 font-mono group-hover:text-amber-100 transition">{inventory.rare}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Mythic Wildcards">
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/60" />
              <span className="font-bold text-orange-300 font-mono group-hover:text-orange-100 transition">{inventory.mythic}</span>
            </div>
          </button>

          {/* Import Deck */}
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141926] hover:bg-[#1c2335] text-stone-200 hover:text-white text-xs font-semibold rounded-xl border border-white/10 hover:border-amber-400/40 shadow-sm transition"
              title="Import MTG Arena formatted decklist"
            >
              <UploadCloud className="w-3.5 h-3.5 text-stone-400" />
              <span>Import</span>
            </button>
          )}

          {/* Export to Arena */}
          <button
            onClick={onOpenExport}
            className="btn-mythic-spark flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition shadow-md"
            title="Export deck to MTG Arena format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Arena</span>
          </button>

          {/* User Account (Cloud or Browser) */}
          {user ? (
            <div className={`flex items-center gap-2 bg-[#141926] px-3 py-1.5 rounded-xl border text-xs shadow-inner ${
              user.isCloudSynced !== false ? 'border-emerald-500/30' : 'border-amber-500/30'
            }`}>
              <div 
                className={`w-2 h-2 rounded-full ${
                  user.isCloudSynced !== false ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`} 
                title={user.isCloudSynced !== false ? 'Cloud Synced' : 'Stored in Browser (Local Account)'} 
              />
              <span className="text-stone-300 font-semibold max-w-[110px] truncate" title={user.email}>
                {user.username || user.email?.split('@')[0]}
              </span>
              {user.isCloudSynced === false && onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  title="Enable Cloud Sync"
                  className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition"
                >
                  Cloud
                </button>
              )}
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1 hover:text-rose-400 text-stone-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold rounded-xl border border-white/10 transition"
            >
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Format Selection Bar for Deck Builder */}
      {currentTab === 'deck_builder' && (
        <div className="max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto mt-2.5 pt-2 border-t border-[#c5a059]/30">
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-gradient-to-r from-[#121622]/95 via-[#182030]/95 to-[#121622]/95 p-2 sm:px-3 rounded-2xl border border-[#c5a059]/35 shadow-xl shadow-black/50">
            {/* Format Label & High-Visibility Format Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/15 border border-amber-400/50 text-amber-300 shadow-sm shadow-amber-500/20 flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider font-fantasy">
                  Format
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0b0e14]/90 p-1 rounded-xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
                {FORMAT_OPTIONS.map(fmt => {
                  const isActive = currentFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => onSelectFormat(fmt.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                        isActive
                          ? fmt.isFlagship
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black shadow-[0_0_18px_rgba(245,158,11,0.6)] border border-amber-300 ring-2 ring-amber-400/50 scale-[1.03]'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black shadow-[0_0_14px_rgba(245,158,11,0.5)] border border-amber-200 ring-2 ring-amber-400/40 scale-[1.02]'
                          : fmt.isFlagship
                            ? 'bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 hover:text-amber-100 border border-amber-500/40 font-bold hover:scale-[1.01]'
                            : 'bg-[#141926] hover:bg-[#1f273a] text-stone-300 hover:text-white border border-white/10 hover:border-amber-400/40 hover:scale-[1.01]'
                      }`}
                    >
                      {fmt.isFlagship ? (
                        <Crown className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                      ) : fmt.id === 'standard' ? (
                        <Swords className={`w-3 h-3 ${isActive ? 'text-slate-950' : 'text-stone-400'}`} />
                      ) : null}
                      <span>{fmt.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        isActive
                          ? 'bg-black/25 text-slate-950'
                          : 'bg-white/5 text-stone-400'
                      }`}>
                        {fmt.cardCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Quick Action / Format Info Badge */}
            <div className="flex items-center gap-2 ml-auto">
              {currentFormat === 'brawl' ? (
                onOpenCommanderFinder && (
                  <button
                    type="button"
                    onClick={onOpenCommanderFinder}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm hover:shadow-amber-500/20 group cursor-pointer"
                    title="Discover Brawl commanders by color identity and playstyle archetypes"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>Find a Commander</span>
                  </button>
                )
              ) : (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-stone-300 text-xs font-semibold">
                  <Swords className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>60-Card Standard Legal • Rotation Safe</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ArenaNavbar;

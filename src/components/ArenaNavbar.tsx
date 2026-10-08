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
  Home
} from 'lucide-react';

export type MainNavTab = 'home' | 'deck_builder' | 'card_library' | 'my_collection' | 'my_decks';

interface ArenaNavbarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  currentFormat: FormatType;
  onSelectFormat: (format: FormatType) => void;
  inventory: WildcardInventory;
  onOpenSync: () => void;
  onOpenExport: () => void;
  hasCommander?: boolean;
  deckCount?: number;
  user?: any;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onOpenWildcards?: () => void;
  onOpenCommanderFinder?: () => void;
}

export const ArenaNavbar: React.FC<ArenaNavbarProps> = ({
  currentTab,
  onSelectTab,
  currentFormat,
  onSelectFormat,
  inventory,
  onOpenSync,
  onOpenExport,
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
      <div className="max-w-7xl xl:max-w-[1536px] 2xl:max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Top-level Navigation Pills */}
        <div className="flex items-center gap-6">
          {/* DieToRemoval Brand (Clickable to Home) */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            title="Go to Home"
            className="flex items-center gap-2.5 group cursor-pointer text-left transition hover:opacity-95 focus:outline-none"
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
          <div className="flex items-center bg-[#0d1017]/90 p-1 rounded-xl border border-white/5 gap-1">
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
            className="hidden sm:flex items-center gap-3 bg-[#0d1017]/90 hover:bg-[#151a26] px-3.5 py-1.5 rounded-xl border border-white/5 hover:border-amber-500/40 text-xs shadow-inner transition cursor-pointer group"
            title="Click to view & edit your Wildcard Stash"
          >
            <div className="flex items-center gap-1 text-[11px]" title="Common Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-400 shadow-sm" />
              <span className="font-bold text-stone-300 font-mono group-hover:text-white transition">{inventory.common}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Uncommon Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="font-bold text-cyan-200 font-mono group-hover:text-cyan-100 transition">{inventory.uncommon}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Rare Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="font-bold text-amber-200 font-mono group-hover:text-amber-100 transition">{inventory.rare}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]" title="Mythic Wildcards">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/60 animate-pulse" />
              <span className="font-bold text-orange-300 font-mono group-hover:text-orange-100 transition">{inventory.mythic}</span>
            </div>
          </button>

          {/* Wildcard Vault Manager CTA */}
          <button
            onClick={onOpenWildcards}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#141926] hover:bg-[#1c2335] text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-amber-500/30 shadow-sm transition"
            title="Set your in-game wildcards for deck crafting calculations"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Wildcard Vault</span>
          </button>

          {/* Export to Arena */}
          <button
            onClick={onOpenExport}
            className="btn-mythic-spark flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold rounded-xl transition shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Arena</span>
          </button>

          {/* Supabase Cloud Account */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#141926] px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Cloud Active" />
              <span className="text-stone-300 font-semibold max-w-[110px] truncate" title={user.email}>
                {user.email?.split('@')[0]}
              </span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 transition shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Pill Menu for Deck Builder Formats */}
      {currentTab === 'deck_builder' && (
        <div className="max-w-7xl mx-auto pt-2 mt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-fantasy font-bold uppercase tracking-wider text-stone-400">
              Format:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'brawl' as FormatType, label: 'Brawl', badge: '100 Cards' },
                { id: 'standard' as FormatType, label: 'Standard', badge: '60 Cards' },
                { id: 'explorer' as FormatType, label: 'Pioneer', badge: '60 Cards' }
              ].map(fmt => {
                const isActive = currentFormat === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => onSelectFormat(fmt.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-[#121622] text-stone-400 hover:text-stone-200 border border-white/5 hover:bg-[#171c28]'
                    }`}
                  >
                    <span>{fmt.label}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                      isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {fmt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {currentFormat === 'brawl' && (
            <div className="flex items-center gap-3">
              {onOpenCommanderFinder && (
                <button
                  type="button"
                  onClick={onOpenCommanderFinder}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition shadow-sm hover:scale-105"
                  title="Discover Brawl commanders by color identity and playstyle archetypes"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Find a Commander</span>
                </button>
              )}
              <span className="hidden md:inline text-[11px] text-amber-400/90 font-semibold">
                ⚔️ 100-Card Singleton • Commander Color Identity Locked
              </span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default ArenaNavbar;

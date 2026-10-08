import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, ManaColor } from '../types/card';
import { searchArenaCards, buildSmartSearchQuery } from '../services/scryfallService';
import { isCardOnArena } from '../services/ownershipService';
import { 
  X, 
  Crown, 
  Search, 
  Loader2, 
  Sparkles, 
  RotateCcw, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Zap,
  ArrowUpDown,
  Shuffle
} from 'lucide-react';
import { CardImage } from './CardImage';
import { 
  COMMANDER_STRATEGIES, 
  CommanderStrategyId, 
  classifyCommanderStrategies 
} from '../utils/commanderStrategyClassifier';

interface CommanderFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommander: (card: Card) => void;
}

export type ColorFilterMode = 'exact' | 'include' | 'at_most';
export type SortOption = 'edhrec' | 'name' | 'cmc_asc' | 'cmc_desc';

export const CommanderFinderModal: React.FC<CommanderFinderModalProps> = ({
  isOpen,
  onClose,
  onSelectCommander
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<ManaColor[]>([]);
  const [colorMode, setColorMode] = useState<ColorFilterMode>('include');
  const [selectedStrategy, setSelectedStrategy] = useState<CommanderStrategyId | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('edhrec');
  const [brawlFormat, setBrawlFormat] = useState<'brawl' | 'standardbrawl'>('brawl');

  const [commanders, setCommanders] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewCommander, setPreviewCommander] = useState<Card | null>(null);

  // Quick Guild / Shard Presets
  const GUILD_PRESETS: { label: string; colors: ManaColor[] }[] = [
    { label: 'Azorius (WU)', colors: ['W', 'U'] },
    { label: 'Dimir (UB)', colors: ['U', 'B'] },
    { label: 'Rakdos (BR)', colors: ['B', 'R'] },
    { label: 'Gruul (RG)', colors: ['R', 'G'] },
    { label: 'Selesnya (GW)', colors: ['G', 'W'] },
    { label: 'Orzhov (WB)', colors: ['W', 'B'] },
    { label: 'Izzet (UR)', colors: ['U', 'R'] },
    { label: 'Golgari (BG)', colors: ['B', 'G'] },
    { label: 'Boros (WR)', colors: ['W', 'R'] },
    { label: 'Simic (UG)', colors: ['U', 'G'] },
    { label: 'Grixis (UBR)', colors: ['U', 'B', 'R'] },
    { label: 'Esper (WUB)', colors: ['W', 'U', 'B'] },
    { label: 'Jund (BRG)', colors: ['B', 'R', 'G'] },
    { label: 'Naya (WRG)', colors: ['W', 'R', 'G'] },
    { label: 'Bant (WUG)', colors: ['W', 'U', 'G'] },
    { label: 'Sultai (UBG)', colors: ['U', 'B', 'G'] },
    { label: 'Mardu (WBR)', colors: ['W', 'B', 'R'] },
    { label: 'Temur (URG)', colors: ['U', 'R', 'G'] },
    { label: 'Abzan (WBG)', colors: ['W', 'B', 'G'] },
    { label: 'Jeskai (WUR)', colors: ['W', 'U', 'R'] },
    { label: '5-Color', colors: ['W', 'U', 'B', 'R', 'G'] },
    { label: 'Colorless', colors: ['C'] }
  ];

  const handleToggleColor = (color: ManaColor) => {
    if (color === 'C') {
      setSelectedColors(prev => prev.includes('C') ? [] : ['C']);
      return;
    }
    setSelectedColors(prev => {
      const withoutC = prev.filter(c => c !== 'C');
      if (withoutC.includes(color)) {
        return withoutC.filter(c => c !== color);
      } else {
        return [...withoutC, color];
      }
    });
  };

  const handleApplyPreset = (colors: ManaColor[]) => {
    setSelectedColors(colors);
    setColorMode('exact');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setColorMode('include');
    setSelectedStrategy(null);
    setSortOption('edhrec');
    setBrawlFormat('brawl');
  };

  const handleSurpriseMe = () => {
    if (commanders.length === 0) return;
    const randomIndex = Math.floor(Math.random() * commanders.length);
    setPreviewCommander(commanders[randomIndex]);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || 
    selectedColors.length > 0 || 
    selectedStrategy !== null || 
    sortOption !== 'edhrec' ||
    brawlFormat !== 'brawl'
  );

  const activeStrategyMeta = useMemo(() => {
    return COMMANDER_STRATEGIES.find(s => s.id === selectedStrategy);
  }, [selectedStrategy]);

  // Query Scryfall and filter live
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const delay = searchTerm.trim() ? 300 : 50;

    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        const queryParts: string[] = [];

        if (searchTerm.trim()) {
          const smart = buildSmartSearchQuery(searchTerm.trim());
          if (smart) queryParts.push(smart);
        }

        if (activeStrategyMeta) {
          queryParts.push(activeStrategyMeta.scryfallQuery);
        }

        const scryfallQuery = queryParts.length > 0 ? queryParts.join(' ') : undefined;

        const order = sortOption === 'cmc_asc' || sortOption === 'cmc_desc' 
          ? 'cmc' 
          : sortOption === 'name' 
            ? 'name' 
            : 'edhrec';
        const dir = sortOption === 'cmc_desc' ? 'desc' : 'asc';

        const result = await searchArenaCards({
          query: scryfallQuery,
          isCommander: true,
          format: brawlFormat === 'standardbrawl' ? 'standard' : 'brawl',
          colors: selectedColors.length > 0 ? selectedColors : undefined,
          colorMode: selectedColors.length > 0 ? colorMode : undefined,
          order,
          dir
        });

        if (isCancelled) return;

        // Strict MTG Arena Verification via official local database
        const arenaStrict = result.cards.filter(c => isCardOnArena(c.name));

        setCommanders(arenaStrict);
        if (arenaStrict.length > 0 && !previewCommander) {
          setPreviewCommander(arenaStrict[0]);
        }
      } catch (err) {
        console.error('Failed to discover commanders:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, delay);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, searchTerm, selectedColors, colorMode, selectedStrategy, sortOption, brawlFormat]);

  if (!isOpen) return null;

  const colorBadgeBg: Record<string, string> = {
    W: 'bg-amber-100 text-amber-950 border-amber-300',
    U: 'bg-sky-500 text-white border-sky-400',
    B: 'bg-slate-800 text-slate-200 border-slate-600',
    R: 'bg-rose-600 text-white border-rose-400',
    G: 'bg-emerald-600 text-white border-emerald-400',
    C: 'bg-zinc-600 text-zinc-100 border-zinc-400'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="arena-panel rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[92vh] border border-[#c5a059]/30">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fantasy font-black text-lg sm:text-xl text-white tracking-wide">
                  Find a New Commander
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {commanders.length} MTGA Commanders
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Explore legendary creatures & planeswalkers playable on MTG Arena by color identity and playstyle strategy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSurpriseMe}
              disabled={commanders.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-[#141a29] hover:bg-[#1c2438] transition border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Randomly choose a commander from the current results"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Surprise Me</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition border border-slate-700"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-2 rounded-xl bg-[#141a29] hover:bg-[#1c2438] transition border border-[#c5a059]/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Colors, Strategy, Format, Search) */}
        <div className="py-3 space-y-3 border-b border-[#c5a059]/20 flex-shrink-0">
          
          {/* Row 1: Search & Format & Sort */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                placeholder="Search commander name, creature type (e.g. Atraxa, Dragon, Elf)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1017] border border-[#c5a059]/30 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 shadow-inner transition"
              />
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Format Toggle */}
            <div className="md:col-span-3 flex items-center bg-[#0d1017] p-1 rounded-xl border border-[#c5a059]/30 text-xs">
              <button
                onClick={() => setBrawlFormat('brawl')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition text-center ${
                  brawlFormat === 'brawl' 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Historic Brawl
              </button>
              <button
                onClick={() => setBrawlFormat('standardbrawl')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition text-center ${
                  brawlFormat === 'standardbrawl' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Standard Brawl
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-4 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#0d1017] border border-[#c5a059]/30 rounded-xl px-2.5 py-1.5 w-full text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-stone-400 font-semibold whitespace-nowrap">Sort:</span>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as SortOption)}
                  className="bg-transparent text-slate-200 font-bold focus:outline-none w-full cursor-pointer"
                >
                  <option value="edhrec" className="bg-slate-900 text-slate-100">Popularity (EDHREC)</option>
                  <option value="name" className="bg-slate-900 text-slate-100">Name (A-Z)</option>
                  <option value="cmc_asc" className="bg-slate-900 text-slate-100">Mana Value (Low to High)</option>
                  <option value="cmc_desc" className="bg-slate-900 text-slate-100">Mana Value (High to Low)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Row 2: Color Identity Selector & Modes */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">
                Colors:
              </span>
              
              {(['W', 'U', 'B', 'R', 'G', 'C'] as ManaColor[]).map(color => {
                const isSelected = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    onClick={() => handleToggleColor(color)}
                    className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border transition-all ${
                      isSelected
                        ? `${colorBadgeBg[color]} ring-2 ring-amber-400 scale-110 shadow-md`
                        : 'bg-[#121622] text-stone-400 border-stone-700/80 hover:border-stone-500 hover:text-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}

              {/* Color Mode Switcher */}
              {selectedColors.length > 0 && selectedColors[0] !== 'C' && (
                <div className="flex items-center bg-[#0d1017] p-0.5 rounded-lg border border-slate-700 ml-2 text-[11px]">
                  <button
                    onClick={() => setColorMode('include')}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      colorMode === 'include' ? 'bg-amber-500 text-slate-950' : 'text-stone-400 hover:text-white'
                    }`}
                    title="Includes all selected colors"
                  >
                    Contains
                  </button>
                  <button
                    onClick={() => setColorMode('exact')}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      colorMode === 'exact' ? 'bg-amber-500 text-slate-950' : 'text-stone-400 hover:text-white'
                    }`}
                    title="Exact color identity only"
                  >
                    Exact
                  </button>
                  <button
                    onClick={() => setColorMode('at_most')}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      colorMode === 'at_most' ? 'bg-amber-500 text-slate-950' : 'text-stone-400 hover:text-white'
                    }`}
                    title="Playable with at most these colors"
                  >
                    At Most
                  </button>
                </div>
              )}
            </div>

            {/* Guild & Preset Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-400 font-semibold hidden lg:inline">Guild Presets:</span>
              <select
                onChange={e => {
                  const match = GUILD_PRESETS.find(p => p.label === e.target.value);
                  if (match) handleApplyPreset(match.colors);
                }}
                className="bg-[#0d1017] text-amber-300 font-semibold border border-[#c5a059]/30 rounded-xl px-2 py-1 text-xs cursor-pointer focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled className="bg-slate-900 text-stone-400">⚡ Pick Guild / Shard...</option>
                {GUILD_PRESETS.map(p => (
                  <option key={p.label} value={p.label} className="bg-slate-900 text-slate-100">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Strategy & Playstyle Filters (Horizontal Carousel) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                Strategy Archetypes:
              </span>
              {selectedStrategy && (
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="text-[11px] text-amber-400 hover:text-amber-200 font-bold underline"
                >
                  Clear Strategy
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedStrategy(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  selectedStrategy === null
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-[#0e121a] text-stone-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>All Strategies</span>
              </button>

              {COMMANDER_STRATEGIES.map(strat => {
                const isSelected = selectedStrategy === strat.id;
                return (
                  <button
                    key={strat.id}
                    onClick={() => setSelectedStrategy(isSelected ? null : strat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg font-black scale-105'
                        : 'bg-[#0e121a] text-stone-300 border-slate-800 hover:border-amber-500/40 hover:text-white'
                    }`}
                    title={strat.description}
                  >
                    <span>{strat.icon}</span>
                    <span>{strat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Main Content: Grid & Side Preview */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 pt-3 min-h-0">
          
          {/* Left Grid of Commanders */}
          <div className="flex-1 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="font-bold text-slate-200">Discovering MTG Arena Commanders...</p>
                <p className="text-xs text-stone-400">Matching color identities and mechanical strategies...</p>
              </div>
            ) : commanders.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <p className="font-bold text-slate-200 text-base">No Commanders Found</p>
                <p className="text-xs text-stone-400 max-w-md">
                  No MTG Arena commanders match the active filter criteria. Try relaxing the color mode, resetting the strategy, or broadening your search terms.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {commanders.map(cmd => {
                  const strategies = classifyCommanderStrategies(cmd);
                  const isHoveredOrPreview = previewCommander?.id === cmd.id;

                  return (
                    <div
                      key={cmd.id}
                      onClick={() => setPreviewCommander(cmd)}
                      onDoubleClick={() => {
                        onSelectCommander(cmd);
                        onClose();
                      }}
                      className={`card-tile group rounded-2xl overflow-hidden p-2 transition cursor-pointer flex flex-col justify-between border ${
                        isHoveredOrPreview
                          ? 'bg-[#181e2c] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)] scale-[1.02]'
                          : 'bg-[#111520]/90 border-[#c5a059]/20 hover:border-amber-400/50 hover:bg-[#161b26]'
                      }`}
                    >
                      <div className="rounded-xl overflow-hidden shadow-md border border-black/60 relative bg-black aspect-[5/7]">
                        <CardImage
                          src={cmd.imageUrl}
                          cardName={cmd.name}
                          alt={cmd.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 text-[9px] font-bold text-amber-300">
                          {cmd.colorIdentity.length > 0 ? cmd.colorIdentity.join('') : 'C'}
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 truncate group-hover:text-amber-300 transition">
                            {cmd.name}
                          </span>
                        </div>

                        {/* Strategy Badges */}
                        <div className="flex items-center gap-1 overflow-hidden flex-nowrap">
                          {strategies.slice(0, 2).map(st => (
                            <span
                              key={st.id}
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-stone-300 truncate border border-slate-700"
                            >
                              {st.icon} {st.label}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                          <span className="font-mono text-amber-400">{cmd.manaCost}</span>
                          <span className="text-[10px] text-stone-500 font-semibold">{cmd.setName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side Commander Inspector / Builder Launchpad */}
          {previewCommander && (
            <div className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0 bg-[#0e121a]/90 border border-[#c5a059]/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-4">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#c5a059]/40 bg-black aspect-[5/7]">
                  <CardImage
                    src={previewCommander.imageUrl}
                    cardName={previewCommander.name}
                    alt={previewCommander.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/85 backdrop-blur-md rounded-xl border border-white/20 text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Commander</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-fantasy font-black text-base text-white leading-tight">
                    {previewCommander.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-stone-400 mt-1">
                    <span className="font-semibold text-stone-300">{previewCommander.typeLine}</span>
                    <span className="font-mono font-bold text-amber-400">{previewCommander.manaCost}</span>
                  </div>
                </div>

                {/* Detected Strategies */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    Playstyle Archetypes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {classifyCommanderStrategies(previewCommander).map(st => (
                      <span
                        key={st.id}
                        className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                      >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                      </span>
                    ))}
                    {classifyCommanderStrategies(previewCommander).length === 0 && (
                      <span className="text-xs text-stone-500 italic">
                        Open Archetype / Goodstuff
                      </span>
                    )}
                  </div>
                </div>

                {/* Oracle Text Snippet */}
                {previewCommander.oracleText && (
                  <div className="bg-[#131722] p-2.5 rounded-xl border border-slate-800 text-xs text-stone-300 leading-relaxed max-h-36 overflow-y-auto font-sans">
                    {previewCommander.oracleText}
                  </div>
                )}
              </div>

              {/* One-Click Select & Build Button */}
              <button
                onClick={() => {
                  onSelectCommander(previewCommander);
                  onClose();
                }}
                className="w-full btn-mythic-spark py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow-xl hover:scale-[1.02] flex-shrink-0"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>Build Deck With {previewCommander.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CommanderFinderModal;

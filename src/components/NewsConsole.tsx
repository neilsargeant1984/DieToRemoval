import React, { useState, useEffect, useMemo } from 'react';
import { 
  NewsCategory, 
  NewsArticle, 
  fetchNewsArticles 
} from '../services/newsService';
import { 
  Newspaper, 
  Globe, 
  Video, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  Filter, 
  Flame, 
  Play, 
  X, 
  Building2,
  Check
} from 'lucide-react';

interface NewsConsoleProps {
  onSelectTag?: (tag: string) => void;
}

export const NewsConsole: React.FC<NewsConsoleProps> = () => {
  const [activeTab, setActiveTab] = useState<NewsCategory>('official');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchTerm] = useState<string>('');
  const [arenaOnlyFilter, setArenaOnlyFilter] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load articles when active tab changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const data = await fetchNewsArticles(activeTab);
        if (!isCancelled) {
          setArticles(data);
          setIsLoading(false);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchNewsArticles(activeTab, true);
      setArticles(data);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered Articles based on search query, Arena-Only toggle, and selected topic tag
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      if (arenaOnlyFilter && !article.isArenaOnly) {
        return false;
      }
      if (selectedTag && !article.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = article.title.toLowerCase().includes(q);
        const matchDesc = article.description.toLowerCase().includes(q);
        const matchSource = article.source.toLowerCase().includes(q);
        const matchTags = article.tags.some(t => t.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchSource || matchTags;
      }
      return true;
    });
  }, [articles, arenaOnlyFilter, selectedTag, searchQuery]);

  // Aggregate tags for the active category
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => {
      a.tags.forEach(t => {
        if (t !== 'Arena Only') set.add(t);
      });
    });
    return Array.from(set).slice(0, 8);
  }, [articles]);

  const arenaCount = useMemo(() => {
    return articles.filter(a => a.isArenaOnly).length;
  }, [articles]);

  const heroArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  return (
    <div className="space-y-6">
      {/* Console Top Header & Primary Navigation Tabs */}
      <div className="bg-[#0f131d]/90 border border-amber-500/30 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <Newspaper className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-fantasy font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 m-0">
                  Magic & Arena News Hub
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Live reports, official announcements, web articles, and top video streams across the MTG multiverse
                </p>
              </div>
            </div>
          </div>

          {/* Refresh & Last Updated Timestamp */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="px-3 py-1.5 rounded-xl bg-[#141a29] hover:bg-[#1c2438] text-xs font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
              title="Refresh news feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* 3 Main Tabs: Official, Around the Web, Video */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-[#0a0d14] p-1.5 rounded-2xl border border-white/5">
            {/* Tab 1: Official */}
            <button
              onClick={() => {
                setActiveTab('official');
                setSelectedTag(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'official'
                  ? 'btn-mythic-spark shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Official (WotC)</span>
            </button>

            {/* Tab 2: Around the Web */}
            <button
              onClick={() => {
                setActiveTab('web');
                setSelectedTag(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'web'
                  ? 'btn-mythic-spark shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Around the Web</span>
            </button>

            {/* Tab 3: Video */}
            <button
              onClick={() => {
                setActiveTab('video');
                setSelectedTag(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'video'
                  ? 'btn-mythic-spark shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Video className="w-4 h-4 text-red-400" />
              <span>Video & Streams</span>
            </button>
          </div>

          {/* Arena Only Filter Button */}
          <button
            onClick={() => setArenaOnlyFilter(!arenaOnlyFilter)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
              arenaOnlyFilter
                ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 text-cyan-200 border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400'
                : 'bg-[#121623] text-stone-300 hover:text-white border-white/10 hover:border-cyan-500/40'
            }`}
            title="Filter to show only MTG Arena digital content"
          >
            <Sparkles className={`w-3.5 h-3.5 ${arenaOnlyFilter ? 'text-cyan-300' : 'text-stone-400'}`} />
            <span>Arena Only</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              arenaOnlyFilter ? 'bg-cyan-500 text-slate-950' : 'bg-white/10 text-stone-300'
            }`}>
              {arenaCount}
            </span>
          </button>
        </div>

        {/* Filter Toolbar: Search Input + Topic Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'official' ? 'official announcements' : activeTab === 'video' ? 'videos & creators' : 'web headlines'}...`}
              value={searchQuery}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0d14] border border-white/10 focus:border-amber-500/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition shadow-inner"
            />
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Topic Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                selectedTag === null
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-[#121623] text-stone-400 hover:text-white border border-white/5'
              }`}
            >
              All Topics
            </button>
            {availableTags.map(tag => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-[#121623] text-stone-400 hover:text-white border-white/5'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="font-bold text-slate-200">Loading {activeTab === 'official' ? 'Official WotC' : activeTab === 'video' ? 'Video Stream' : 'Web'} News...</p>
          <p className="text-xs text-stone-500">Checking latest feeds from across the Magic multiverse</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-[#0f131d]/90 border border-white/10 rounded-3xl p-12 text-center space-y-3">
          <p className="text-base font-bold text-stone-200">No articles match your active filter</p>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Try clearing the search term or turning off the Arena Only toggle to view all coverage.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setArenaOnlyFilter(false);
              setSelectedTag(null);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Featured Hero Article */}
          {heroArticle && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-[#0e121b] shadow-2xl group transition">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
                {/* Hero Media Preview */}
                <div className="lg:col-span-5 relative overflow-hidden bg-black min-h-[220px] lg:min-h-[300px]">
                  <img
                    src={heroArticle.imageUrl}
                    alt={heroArticle.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e121b] via-transparent to-transparent lg:hidden" />
                  
                  {activeTab === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/50 shadow">
                      ⭐ Breaking Story
                    </span>
                    {heroArticle.isArenaOnly && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-cyan-950/90 backdrop-blur-md text-cyan-300 border border-cyan-400/60 shadow flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-300" />
                        Arena Only
                      </span>
                    )}
                  </div>
                </div>

                {/* Hero Content */}
                <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      <span className="font-extrabold text-amber-400">{heroArticle.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-stone-500" />
                        {heroArticle.relativeTime}
                      </span>
                      {heroArticle.duration && (
                        <>
                          <span>•</span>
                          <span className="text-red-400 font-bold font-mono">▶ {heroArticle.duration}</span>
                        </>
                      )}
                    </div>

                    <a
                      href={heroArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group/link"
                    >
                      <h4 className="text-lg md:text-2xl font-bold text-white group-hover/link:text-amber-300 transition-colors leading-snug">
                        {heroArticle.title}
                      </h4>
                    </a>

                    <p className="text-xs md:text-sm text-stone-300 leading-relaxed line-clamp-3">
                      {heroArticle.description}
                    </p>
                  </div>

                  {/* Hero Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {heroArticle.tags.map(t => (
                        <span
                          key={t}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t === 'Arena Only'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                              : 'bg-white/5 text-stone-400 border border-white/5'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <a
                      href={heroArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-mythic-spark px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 transition"
                    >
                      <span>{activeTab === 'video' ? 'Watch Stream' : 'Read Full Coverage'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Remaining Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridArticles.map(article => (
              <div
                key={article.id}
                className="bg-[#0f131d]/90 border border-white/10 hover:border-amber-400/40 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-lg hover:shadow-2xl"
              >
                {/* Card Media Preview */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {activeTab === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition">
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-black/80 backdrop-blur-md text-amber-300 border border-white/15">
                      {article.source}
                    </span>

                    {/* Arena Only Badge */}
                    {article.isArenaOnly && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-cyan-950/90 backdrop-blur-md text-cyan-300 border border-cyan-400/60 shadow flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                        <span>Arena Only</span>
                      </span>
                    )}
                  </div>

                  {/* Video duration badge */}
                  {article.duration && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/90 font-mono text-[10px] font-bold text-white border border-white/20">
                      {article.duration}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-medium text-stone-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-stone-500" />
                        {article.relativeTime}
                      </span>
                      {article.channelName && (
                        <span className="font-bold text-amber-400 truncate max-w-[140px]">
                          {article.channelName}
                        </span>
                      )}
                    </div>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group/title"
                    >
                      <h4 className="text-sm font-bold text-stone-100 group-hover/title:text-amber-300 transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h4>
                    </a>

                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">
                      {article.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {article.tags.slice(0, 2).map(t => (
                        <span
                          key={t}
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            t === 'Arena Only'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                              : 'bg-white/5 text-stone-400'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                    >
                      <span>{activeTab === 'video' ? 'Watch' : 'Read'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsConsole;

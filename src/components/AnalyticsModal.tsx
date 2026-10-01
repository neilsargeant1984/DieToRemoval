import React from 'react';
import { DeckStats } from '../utils/deckAnalytics';
import { X, BarChart2, PieChart, Layers } from 'lucide-react';

interface AnalyticsModalProps {
  stats: DeckStats;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  stats,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const maxCurveCount = Math.max(...stats.manaCurve.map(c => c.count), 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-500" />
            <h2 className="font-fantasy font-black text-lg text-slate-100">Deck Statistics & Mana Curve</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top summary metrics */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-[#0e121a] p-3 rounded-xl border border-[#c5a059]/20 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">Total Cards</span>
            <span className="text-xl font-black text-slate-100">{stats.totalCards}</span>
          </div>
          <div className="bg-[#0e121a] p-3 rounded-xl border border-[#c5a059]/20 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">Lands</span>
            <span className="text-xl font-black text-amber-400">{stats.landCount}</span>
          </div>
          <div className="bg-[#0e121a] p-3 rounded-xl border border-[#c5a059]/20 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">Spells / Creatures</span>
            <span className="text-xl font-black text-slate-100">{stats.nonLandCount}</span>
          </div>
          <div className="bg-[#0e121a] p-3 rounded-xl border border-[#c5a059]/20 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold block">Average Mana Value</span>
            <span className="text-xl font-black text-amber-400">{stats.averageCmc}</span>
          </div>
        </div>

        {/* Mana Curve Histogram */}
        <div className="bg-[#0e121a]/80 border border-[#c5a059]/25 rounded-2xl p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-fantasy font-bold uppercase tracking-wider text-[#c5a059]">
              Mana Curve (Converted Mana Cost)
            </span>
            <span className="text-xs text-slate-400">Excludes lands</span>
          </div>

          <div className="flex items-end justify-between gap-3 h-40 pt-6 px-2">
            {stats.manaCurve.map(pt => {
              const heightPct = Math.round((pt.count / maxCurveCount) * 100);
              return (
                <div key={pt.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs font-black text-amber-400">
                    {pt.count > 0 ? pt.count : ''}
                  </span>
                  <div className="w-full bg-[#161b26] rounded-t-md relative flex items-end justify-center overflow-hidden h-28 border-b border-[#c5a059]/40">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-400 rounded-t transition-all duration-300 shadow-sm"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">{pt.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color Pips vs Land Sources */}
        <div className="bg-[#0e121a]/80 border border-[#c5a059]/25 rounded-2xl p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-fantasy font-bold uppercase tracking-wider text-[#c5a059]">
              Color Pips in Spells vs. Mana Land Sources
            </span>
          </div>

          <div className="space-y-3">
            {stats.colorPips
              .filter(p => p.pips > 0 || p.landSources > 0)
              .map(p => (
                <div key={p.color} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block shadow-sm"
                        style={{ backgroundColor: p.barColor }}
                      />
                      {p.label}
                    </span>
                    <span className="text-slate-400">
                      Pips: <strong className="text-slate-100">{p.pips}</strong> | Land Sources: <strong className="text-amber-400">{p.landSources}</strong>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[#161b26] rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${Math.min(100, p.pips * 4)}%`, backgroundColor: p.barColor }}
                      className="h-full opacity-90"
                      title={`${p.pips} color pips`}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Card Types Breakdown */}
        <div className="bg-[#0e121a]/80 border border-[#c5a059]/25 rounded-2xl p-4 space-y-3 shadow-inner">
          <span className="text-xs font-fantasy font-bold uppercase tracking-wider text-[#c5a059] block">
            Card Type Ratios
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats.typeBreakdown.map(tb => (
              <div key={tb.type} className="bg-[#161b26] border border-[#c5a059]/20 p-2.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
                <span className="text-slate-300 font-semibold">{tb.type}</span>
                <span className="font-black text-amber-400">{tb.count} ({tb.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

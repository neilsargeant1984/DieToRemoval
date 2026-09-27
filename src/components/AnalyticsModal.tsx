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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Deck Statistics & Mana Curve</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top summary metrics */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 block">Total Cards</span>
            <span className="text-xl font-bold text-slate-100">{stats.totalCards}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 block">Lands</span>
            <span className="text-xl font-bold text-amber-400">{stats.landCount}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 block">Spells / Creatures</span>
            <span className="text-xl font-bold text-slate-100">{stats.nonLandCount}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-500 block">Average Mana Value</span>
            <span className="text-xl font-bold text-sky-400">{stats.averageCmc}</span>
          </div>
        </div>

        {/* Mana Curve Histogram */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mana Curve (Converted Mana Cost)
            </span>
            <span className="text-xs text-slate-500">Excludes lands</span>
          </div>

          <div className="flex items-end justify-between gap-3 h-40 pt-6 px-2">
            {stats.manaCurve.map(pt => {
              const heightPct = Math.round((pt.count / maxCurveCount) * 100);
              return (
                <div key={pt.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs font-bold text-amber-300">
                    {pt.count > 0 ? pt.count : ''}
                  </span>
                  <div className="w-full bg-slate-800/80 rounded-t-md relative flex items-end justify-center overflow-hidden h-28">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-300 shadow-lg shadow-amber-500/20"
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400">{pt.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color Pips vs Land Sources */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Color Pips in Spells vs. Mana Land Sources
            </span>
          </div>

          <div className="space-y-3">
            {stats.colorPips
              .filter(p => p.pips > 0 || p.landSources > 0)
              .map(p => (
                <div key={p.color} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: p.barColor }}
                      />
                      {p.label}
                    </span>
                    <span className="text-slate-400">
                      Pips: <strong className="text-slate-100">{p.pips}</strong> | Land Sources: <strong className="text-amber-400">{p.landSources}</strong>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, p.pips * 4)}%`, backgroundColor: p.barColor }}
                      className="h-full opacity-80"
                      title={`${p.pips} color pips`}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Card Types Breakdown */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Card Type Ratios
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats.typeBreakdown.map(tb => (
              <div key={tb.type} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-300">{tb.type}</span>
                <span className="font-bold text-amber-300">{tb.count} ({tb.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

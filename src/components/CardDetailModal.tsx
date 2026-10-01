import React from 'react';
import { Card } from '../types/card';
import { X, BookOpen, Sparkles } from 'lucide-react';
import { calculateSynergy } from '../utils/synergyGraph';
import { explainSynergy } from '../utils/synergyExplainer';
import { getCardRoleChips, classifyCardRoles } from '../utils/roleClassifier';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onAddCard: (card: Card, toSideboard?: boolean) => void;
  commander?: Card;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  onClose,
  onAddCard,
  commander
}) => {
  if (!card) return null;

  const synergyMatch = commander ? calculateSynergy(commander, card) : null;
  const roleChips = getCardRoleChips(card);
  const cardRoles = classifyCardRoles(card);
  const synergyReason = commander 
    ? (synergyMatch 
        ? explainSynergy(commander, synergyMatch) 
        : (cardRoles.explanation[0] || `On-color support card for ${commander.name}`))
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Card Image */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center">
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full rounded-2xl shadow-xl border border-black/60 object-cover bg-black"
          />
          <div className="mt-4 flex gap-2 w-full">
            <button
              onClick={() => {
                onAddCard(card, false);
                onClose();
              }}
              className="btn-mythic-spark flex-1 py-2 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
            >
              + Mainboard
            </button>
            <button
              onClick={() => {
                onAddCard(card, true);
                onClose();
              }}
              className="flex-1 py-2 bg-[#161b26] hover:bg-[#202737] text-slate-200 font-bold text-xs rounded-xl border border-[#c5a059]/30 transition"
            >
              + Sideboard
            </button>
          </div>
        </div>

        {/* Right: Detailed Metadata & Spellbook */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-fantasy font-black text-xl text-slate-100">{card.name}</h2>
              {card.isDigitalOnly && (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/50 px-2.5 py-0.5 rounded-full shadow-sm">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Digital Only
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">
              {card.typeLine} • Mana Value: {card.cmc}
            </div>
          </div>

          {/* Oracle Text */}
          <div className="bg-[#0e121a] border border-[#c5a059]/25 rounded-2xl p-4 text-sm text-slate-200 whitespace-pre-line leading-relaxed shadow-sm font-sans">
            {card.oracleText || 'No rules text.'}
          </div>

          {/* Commander Synergy Breakdown */}
          {commander && (
            <div className="bg-[#131722] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Commander Synergy: {commander.name}</span>
                </div>
                {synergyMatch && (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {synergyMatch.score}% Match
                  </span>
                )}
              </div>

              {roleChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {roleChips.map(rc => (
                    <span
                      key={rc.id}
                      className={`text-[9px] px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${rc.style}`}
                    >
                      <span>{rc.icon}</span>
                      <span>{rc.label}</span>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-200 font-medium leading-relaxed bg-[#0e121a] p-3 rounded-xl border border-[#c5a059]/20 shadow-sm">
                💡 {synergyReason}
              </p>
            </div>
          )}

          {/* Arena Specific Properties */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0e121a] p-2.5 rounded-xl border border-[#c5a059]/20">
              <span className="text-slate-400 block">MTG Arena ID</span>
              <span className="font-mono font-bold text-amber-400">{card.arenaId}</span>
            </div>
            <div className="bg-[#0e121a] p-2.5 rounded-xl border border-[#c5a059]/20">
              <span className="text-slate-400 block">Set & Number</span>
              <span className="font-mono text-slate-200 font-bold">{card.set} #{card.collectorNumber}</span>
            </div>
          </div>

          {/* Arena Format Legality Matrix */}
          <div>
            <span className="text-xs font-fantasy font-bold uppercase text-[#c5a059] tracking-wider block mb-1.5">
              Arena Format Legalities
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {Object.entries(card.legalities).map(([fmt, isLegal]) => (
                <span
                  key={fmt}
                  className={`px-2.5 py-0.5 rounded-md font-bold capitalize border ${
                    isLegal
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#161b26] text-slate-500 border border-slate-700/60 line-through'
                  }`}
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Digital Spellbook / Conjure Drawer */}
          {card.spellbook && card.spellbook.length > 0 && (
            <div className="pt-3 border-t border-[#c5a059]/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Spellbook Cards ({card.spellbook.length})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                In MTG Arena, playing or activating this card allows you to draft or conjure one of these specific cards:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {card.spellbook.map((sb, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0e121a] border border-[#c5a059]/20 rounded-xl p-2.5 text-xs space-y-1 shadow-sm"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{sb.name}</span>
                      <span className="text-amber-400 font-mono text-[11px]">{sb.manaCost}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                      {sb.oracleText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;

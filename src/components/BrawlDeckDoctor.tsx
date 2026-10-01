import React from 'react';
import { Card } from '../types/card';
import { Deck } from '../types/deck';
import { analyzeBrawlDeckHealth } from '../utils/rampAdvisor';
import { validateBrawlDeck } from '../utils/brawlValidator';
import { FunctionalRole } from '../utils/roleClassifier';
import { ManaCost } from './ManaCost';
import { 
  Zap, 
  Shield, 
  Target, 
  Bomb, 
  BookOpen, 
  Mountain, 
  AlertTriangle, 
  CheckCircle2, 
  Crown,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface BrawlDeckDoctorProps {
  deck: Deck;
  onSelectRoleFilter: (role: FunctionalRole | 'lands') => void;
  onOpenCommanderPicker: () => void;
  onOpenSynergyMatrix: () => void;
}

export const BrawlDeckDoctor: React.FC<BrawlDeckDoctorProps> = ({
  deck,
  onSelectRoleFilter,
  onOpenCommanderPicker,
  onOpenSynergyMatrix
}) => {
  const commander = deck.commander?.card;
  const health = analyzeBrawlDeckHealth(deck.mainboard, commander);
  const validation = validateBrawlDeck(deck);

  const roles = [
    {
      id: 'ramp' as FunctionalRole,
      label: 'Ramp',
      icon: Zap,
      current: health.counts.ramp,
      target: health.targets.ramp.optimal,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400',
      tag: `Target ${health.targets.ramp.targetRampCmc}-CMC`
    },
    {
      id: 'protection' as FunctionalRole,
      label: 'Protection',
      icon: Shield,
      current: health.counts.protection,
      target: health.targets.protection.optimal,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400',
      tag: 'Hexproof/Ward'
    },
    {
      id: 'removal' as FunctionalRole,
      label: 'Removal',
      icon: Target,
      current: health.counts.removal,
      target: health.targets.removal.optimal,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400',
      tag: 'Spot Interaction'
    },
    {
      id: 'board_wipe' as FunctionalRole,
      label: 'Board Wipes',
      icon: Bomb,
      current: health.counts.board_wipe,
      target: health.targets.board_wipe.optimal,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400',
      tag: 'Mass Sweepers'
    },
    {
      id: 'card_advantage' as FunctionalRole,
      label: 'Card Advantage',
      icon: BookOpen,
      current: health.counts.card_advantage,
      target: health.targets.card_advantage.optimal,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400',
      tag: 'Draw Engines'
    },
    {
      id: 'lands' as const,
      label: 'Lands',
      icon: Mountain,
      current: health.counts.lands,
      target: health.targets.lands.optimal,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      tag: 'Mana Base'
    }
  ];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Top Header: Commander Info & Status */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Brawl Deck Doctor
              </span>
              {validation.isValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-2 py-0.2 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Brawl Legal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800 px-2 py-0.2 rounded-full">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {validation.messages[0] || 'Needs Attention'}
                </span>
              )}
            </div>

            {commander ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-100">{commander.name}</span>
                <ManaCost manaCost={commander.manaCost} size="sm" />
                <div className="flex items-center gap-1 ml-1">
                  {commander.colorIdentity.map(c => (
                    <span
                      key={c}
                      className="w-3.5 h-3.5 rounded-full text-[9px] font-extrabold flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs text-rose-400 font-medium">No Commander Assigned Yet</span>
            )}
          </div>
        </div>

        {/* Action Buttons: Synergies & Change Commander */}
        <div className="flex items-center gap-2">
          {commander && (
            <button
              onClick={onOpenSynergyMatrix}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-lg transition shadow-md hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950 font-bold" />
              <span>⚡ Find Synergies</span>
            </button>
          )}

          <button
            onClick={onOpenCommanderPicker}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition shadow-sm"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{commander ? 'Change Commander' : 'Assign Commander'}</span>
          </button>
        </div>
      </div>



      {/* Role Health Progress Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {roles.map(r => {
          const Icon = r.icon;
          const pct = Math.min(100, Math.round((r.current / r.target) * 100));
          const isOptimal = r.current >= r.target;

          return (
            <button
              key={r.id}
              onClick={() => onSelectRoleFilter(r.id)}
              className="bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-slate-700 p-2.5 rounded-xl text-left transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-300 transition">
                    <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                    <span className="text-xs font-semibold">{r.label}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-200">
                    {r.current}/{r.target}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full transition-all duration-300 ${
                      isOptimal ? 'bg-emerald-400' : r.bgColor
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate">{r.tag}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-amber-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

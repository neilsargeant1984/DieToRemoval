import React from 'react';
import { FormatType } from '../types/card';
import {
  Sparkles,
  BarChart2,
  Shuffle,
  UploadCloud,
  Download,
  Upload,
  PlusCircle,
  Flame,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentFormat: FormatType;
  onChangeFormat: (format: FormatType) => void;
  onOpenMetaDecks: () => void;
  onOpenSyncCollection: () => void;
  onOpenAnalytics: () => void;
  onOpenGoldfish: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onNewDeck: () => void;
  collectionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentFormat,
  onChangeFormat,
  onOpenMetaDecks,
  onOpenSyncCollection,
  onOpenAnalytics,
  onOpenGoldfish,
  onOpenExport,
  onOpenImport,
  onNewDeck,
  collectionCount
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-100 tracking-tight m-0 leading-none">
                ARENA<span className="text-amber-400">FORGE</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Arena Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 mt-0.5">
              Dedicated Deckbuilder & Wildcard Engine for MTG Arena
            </p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Format:</span>
          <select
            value={currentFormat}
            onChange={e => onChangeFormat(e.target.value as FormatType)}
            className="bg-transparent text-amber-300 font-bold text-xs uppercase focus:outline-none cursor-pointer"
          >
            <option value="standard" className="bg-slate-900 text-slate-100">Standard</option>
            <option value="timeless" className="bg-slate-900 text-slate-100">Timeless</option>
            <option value="historic" className="bg-slate-900 text-slate-100">Historic</option>
            <option value="explorer" className="bg-slate-900 text-slate-100">Explorer / Pioneer</option>
            <option value="brawl" className="bg-slate-900 text-slate-100">Brawl</option>
            <option value="alchemy" className="bg-slate-900 text-slate-100">Alchemy</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={onOpenMetaDecks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Meta Decks</span>
          </button>

          <button
            onClick={onOpenSyncCollection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Collection {collectionCount > 0 && `(${collectionCount})`}</span>
          </button>

          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Curve</span>
          </button>

          <button
            onClick={onOpenGoldfish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
            <span>Test Hand</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow shadow-amber-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Arena</span>
          </button>

          <button
            onClick={onNewDeck}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Create blank new deck"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

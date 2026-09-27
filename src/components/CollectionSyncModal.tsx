import React, { useState } from 'react';
import { UserCollection } from '../types/collection';
import { parsePlayerLog } from '../utils/arenaParser';
import { ARENA_CARDS } from '../data/arenaCards';
import { X, UploadCloud, CheckCircle2, FileText, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CollectionSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCollection: (collection: UserCollection) => void;
  currentCollectionCount: number;
}

export const CollectionSyncModal: React.FC<CollectionSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCollection,
  currentCollectionCount
}) => {
  const [logText, setLogText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessLog = (text: string) => {
    const result = parsePlayerLog(text);
    if (result.totalUniqueCards > 0) {
      onSyncCollection(result.collection);
      setStatusMessage(`Successfully imported ${result.totalUniqueCards} unique cards (${result.totalOwnedCards} total copies) from MTG Arena!`);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } else {
      setStatusMessage('No valid Arena card IDs found in input. Make sure detailed logging is enabled in MTG Arena Settings.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessLog(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCollection = () => {
    // Generate a realistic user collection where the player owns various staples
    const sampleCol: UserCollection = {};
    ARENA_CARDS.forEach((card, index) => {
      // Player owns 4 of commons/uncommons, 2-4 of staples, 0-2 of mythics
      if (card.rarity === 'common' || card.rarity === 'uncommon') {
        sampleCol[card.arenaId] = 4;
      } else if (card.rarity === 'rare') {
        sampleCol[card.arenaId] = index % 3 === 0 ? 4 : (index % 3 === 1 ? 2 : 1);
      } else if (card.rarity === 'mythic') {
        sampleCol[card.arenaId] = index % 2 === 0 ? 1 : 0;
      }
    });

    onSyncCollection(sampleCol);
    setStatusMessage(`Loaded active sample collection with ${Object.keys(sampleCol).length} cards.`);
    confetti({ particleCount: 70, spread: 70 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Sync MTG Arena Collection</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info guide */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-amber-300">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>How to locate your Arena Player.log</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            1. In MTG Arena, go to <strong>Options &gt; Account</strong> and check <strong>"Detailed Logs (Plugin Support)"</strong>.<br />
            2. Locate your log file at:
          </p>
          <code className="block bg-slate-900 px-2 py-1 rounded text-[11px] text-amber-200 border border-slate-800 select-all font-mono break-all">
            %APPDATA%\..\LocalLow\Wizards Of The Coast\MTGA\Player.log
          </code>
        </div>

        {/* Upload Drop Zone */}
        <div className="border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl p-6 text-center transition bg-slate-950/40">
          <input
            type="file"
            id="logFileInput"
            accept=".log,.txt,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="logFileInput" className="cursor-pointer space-y-2 block">
            <FileText className="w-8 h-8 mx-auto text-amber-400" />
            <div className="text-sm font-semibold text-slate-200">
              Click to select Player.log or drag & drop here
            </div>
            <p className="text-xs text-slate-500">Supports .log, .txt, or exported inventory JSON</p>
          </label>
        </div>

        {/* Or paste directly */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">
            Or paste log content / JSON payload:
          </label>
          <textarea
            value={logText}
            onChange={e => setLogText(e.target.value)}
            placeholder='Paste Player.log text or { "82133": 4, "76543": 2 }...'
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
          />
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleLoadSampleCollection}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
          >
            Load Sample Collection (Test Mode)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleProcessLog(logText)}
              disabled={!logText.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              Process & Sync
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

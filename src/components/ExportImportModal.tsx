import React, { useState } from 'react';
import { Deck } from '../types/deck';
import { exportToArenaFormat, parseArenaFormat } from '../utils/arenaParser';
import { X, Copy, Check, Download, Upload, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportImportModalProps {
  deck: Deck;
  isOpen: boolean;
  mode: 'export' | 'import';
  onClose: () => void;
  onImportDeck: (importedDeck: Partial<Deck>) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  deck,
  isOpen,
  mode,
  onClose,
  onImportDeck
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [unrecognized, setUnrecognized] = useState<string[]>([]);

  if (!isOpen) return null;

  const exportContent = exportToArenaFormat(deck);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExecuteImport = () => {
    const { mainboard, sideboard, commander, unrecognizedCards } = parseArenaFormat(importText);
    setUnrecognized(unrecognizedCards);

    if (mainboard.length > 0 || sideboard.length > 0) {
      onImportDeck({
        mainboard,
        sideboard,
        commander,
        updatedAt: new Date().toISOString()
      });
      if (unrecognizedCards.length === 0) {
        onClose();
        confetti({ particleCount: 60, spread: 60 });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {mode === 'export' ? (
              <Download className="w-5 h-5 text-amber-400" />
            ) : (
              <Upload className="w-5 h-5 text-sky-400" />
            )}
            <h2 className="text-lg font-bold text-slate-100">
              {mode === 'export' ? 'Export for MTG Arena Client' : 'Import from MTG Arena'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'export' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              This deck list is strictly formatted with MTG Arena set codes and collector numbers. In MTG Arena, simply click <strong>Decks &gt; Import</strong>!
            </p>

            <textarea
              readOnly
              value={exportContent}
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-200 select-all focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Paste deck text copied from the MTG Arena game client:
            </p>

            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Deck&#10;4 Lightning Bolt (STA) 42&#10;4 Brainstorm (STA) 13&#10;..."
              className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />

            {unrecognized.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800 text-amber-300 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Some cards were not found in current Arena database:</span>
                </div>
                <div className="text-[11px] text-amber-200/80 font-mono">
                  {unrecognized.join(', ')}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleExecuteImport}
                disabled={!importText.trim()}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                Import Deck
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

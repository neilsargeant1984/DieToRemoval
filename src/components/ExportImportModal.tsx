import React, { useState } from 'react';
import { Deck } from '../types/deck';
import { exportToArenaFormat, parseArenaFormatAsync } from '../utils/arenaParser';
import { X, Copy, Check, Download, Upload, AlertCircle, Loader2 } from 'lucide-react';
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
  const [isImporting, setIsImporting] = useState(false);
  const [unrecognized, setUnrecognized] = useState<string[]>([]);

  if (!isOpen) return null;

  const exportContent = exportToArenaFormat(deck);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    setUnrecognized([]);

    try {
      const { mainboard, sideboard, commander, unrecognizedCards } = await parseArenaFormatAsync(importText);
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
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
          <div className="flex items-center gap-2">
            {mode === 'export' ? (
              <Download className="w-5 h-5 text-amber-500" />
            ) : (
              <Upload className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="font-fantasy font-black text-lg text-slate-100">
              {mode === 'export' ? 'Export for MTG Arena Client' : 'Import from MTG Arena'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'export' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              This deck list is strictly formatted with MTG Arena set codes and collector numbers. In MTG Arena, simply click <strong className="text-amber-400">Decks &gt; Import</strong>!
            </p>

            <textarea
              readOnly
              value={exportContent}
              className="w-full h-64 bg-[#0e121a] border border-[#c5a059]/30 rounded-xl p-3 text-xs font-mono text-slate-200 select-all focus:outline-none shadow-inner"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCopy}
                className="btn-mythic-spark flex items-center gap-2 px-5 py-2.5 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Paste deck text copied from the MTG Arena game client:
            </p>

            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Deck&#10;4 Lightning Bolt (STA) 42&#10;4 Brainstorm (STA) 13&#10;..."
              className="w-full h-56 bg-[#0e121a] border border-[#c5a059]/30 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/80 placeholder-slate-500 shadow-inner"
            />

            {unrecognized.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Some cards were not found in current Arena database:</span>
                </div>
                <div className="text-[11px] text-amber-300/80 font-mono">
                  {unrecognized.join(', ')}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleExecuteImport}
                disabled={!importText.trim() || isImporting}
                className="btn-mythic-spark flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition"
              >
                {isImporting && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
                {isImporting ? 'Importing & Validating...' : 'Import Deck'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

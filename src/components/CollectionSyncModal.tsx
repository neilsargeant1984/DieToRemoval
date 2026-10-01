import React, { useState } from 'react';
import { UserCollection } from '../types/collection';
import { Deck } from '../types/deck';
import { parsePlayerLog, parsePlayerLogDecks } from '../utils/arenaParser';
import { ARENA_CARDS } from '../data/arenaCards';
import { 
  X, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Info, 
  Loader2,
  FolderHeart,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CollectionSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCollection: (collection: UserCollection) => void;
  onSyncDecks: (decks: Deck[]) => void;
  currentCollectionCount: number;
}

export const CollectionSyncModal: React.FC<CollectionSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCollection,
  onSyncDecks
}) => {
  const [logText, setLogText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    deckCount?: number;
    cardCount?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleProcessLog = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      // 1. Try parsing full decks and owned cards from Player.log
      const deckResult = await parsePlayerLogDecks(text);
      
      // 2. Also try parsing direct collection payload or tracker JSON
      const collectionResult = parsePlayerLog(text);

      // Merge cards found in decks with cards found in collection payload
      const mergedCollection: UserCollection = { ...collectionResult.collection };
      for (const [cidStr, qty] of Object.entries(deckResult.newCollectionCards)) {
        const cid = parseInt(cidStr, 10);
        mergedCollection[cid] = Math.max(mergedCollection[cid] || 0, qty);
      }

      const totalUniqueCards = Object.keys(mergedCollection).length;
      const totalDecksFound = deckResult.decks.length;

      if (totalDecksFound > 0 || totalUniqueCards > 0) {
        if (totalDecksFound > 0) {
          onSyncDecks(deckResult.decks);
        }
        if (totalUniqueCards > 0) {
          onSyncCollection(mergedCollection);
        }

        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setStatusMessage({
          type: 'success',
          text: `Account sync successful! Synced ${totalDecksFound} deck(s) and ${totalUniqueCards} unique card(s).`,
          deckCount: totalDecksFound,
          cardCount: totalUniqueCards
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No valid decks or card inventory found in this input. Make sure to open the Decks tab in MTG Arena before copying Player.log, or drop an exported inventory JSON.'
        });
      }
    } catch (err) {
      console.error('Error processing Arena account log:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to process log file. Please check the file formatting.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) {
        await handleProcessLog(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCollection = () => {
    const sampleCol: UserCollection = {};
    ARENA_CARDS.forEach((card, index) => {
      if (card.rarity === 'common' || card.rarity === 'uncommon') {
        sampleCol[card.arenaId] = 4;
      } else if (card.rarity === 'rare') {
        sampleCol[card.arenaId] = index % 3 === 0 ? 4 : (index % 3 === 1 ? 2 : 1);
      } else if (card.rarity === 'mythic') {
        sampleCol[card.arenaId] = index % 2 === 0 ? 1 : 0;
      }
    });

    onSyncCollection(sampleCol);
    confetti({ particleCount: 70, spread: 70 });
    setStatusMessage({
      type: 'success',
      text: `Loaded active sample collection with ${Object.keys(sampleCol).length} cards for testing.`,
      cardCount: Object.keys(sampleCol).length
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-fantasy font-black text-lg text-white">Sync MTG Arena Account</h2>
              <p className="text-xs text-stone-400">Import your decks to "My Decks" and card collection to "My Collection"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info guide */}
        <div className="bg-[#0d1017] border border-white/5 rounded-2xl p-4 text-xs text-stone-300 space-y-2 shadow-inner">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>How to locate your Arena Player.log</span>
          </div>
          <p className="text-stone-400 leading-relaxed">
            1. In MTG Arena, go to <strong>Options &gt; Account</strong> and check <strong>"Detailed Logs (Plugin Support)"</strong>.<br />
            2. Visit your <strong>Decks</strong> tab in MTG Arena once so Arena writes your current decks to the log file.<br />
            3. Locate and drop your log file from:
          </p>
          <code className="block bg-black/50 px-2.5 py-1.5 rounded-lg text-[11px] text-amber-300 border border-white/10 select-all font-mono break-all font-bold">
            %APPDATA%\..\LocalLow\Wizards Of The Coast\MTGA\Player.log
          </code>
        </div>

        {/* Upload Drop Zone */}
        <div className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 text-center transition bg-[#0d1017]/50 hover:bg-[#0d1017] shadow-sm">
          <input
            type="file"
            id="logFileInput"
            accept=".log,.txt,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="logFileInput" className="cursor-pointer space-y-2 block">
            <FileText className="w-8 h-8 mx-auto text-amber-400" />
            <div className="text-sm font-bold text-stone-200">
              Click to select Player.log or drag &amp; drop here
            </div>
            <p className="text-xs text-stone-500">Supports Player.log, .txt, or tracker exported JSON</p>
          </label>
        </div>

        {/* Or paste directly */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-fantasy font-bold text-stone-300 block uppercase tracking-wider">
              Or paste log content / JSON payload:
            </label>
            {logText && (
              <button
                onClick={() => {
                  setLogText('');
                  setStatusMessage(null);
                }}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold transition hover:underline"
                title="Wipe text in box"
              >
                <Trash2 className="w-3 h-3" />
                <span>Wipe Box</span>
              </button>
            )}
          </div>
          <textarea
            value={logText}
            onChange={e => setLogText(e.target.value)}
            placeholder='Paste Player.log text or tracker inventory JSON...'
            className="w-full h-24 bg-[#0d1017] border border-white/10 rounded-xl p-3 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500 placeholder-stone-500 shadow-inner"
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-start gap-2 shadow-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-500/60 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <p>{statusMessage.text}</p>
              {statusMessage.type === 'success' && (
                <div className="flex items-center gap-3 pt-1 text-[11px] font-bold">
                  {statusMessage.deckCount !== undefined && statusMessage.deckCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-300">
                      <FolderHeart className="w-3.5 h-3.5" />
                      Saved to My Decks &gt; Imported Decks
                    </span>
                  )}
                  {statusMessage.cardCount !== undefined && statusMessage.cardCount > 0 && (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Available in My Collection
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleLoadSampleCollection}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold underline underline-offset-4"
          >
            Load Sample Cards (Test Mode)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleProcessLog(logText)}
              disabled={!logText.trim() || isProcessing}
              className="btn-mythic-spark flex items-center gap-1.5 px-4 py-2 font-extrabold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isProcessing ? 'Processing...' : 'Process & Sync'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 font-bold text-xs rounded-xl border border-white/10 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionSyncModal;

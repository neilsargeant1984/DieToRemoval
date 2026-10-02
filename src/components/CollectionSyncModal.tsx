import React, { useState } from 'react';
import { UserCollection, WildcardInventory } from '../types/collection';
import { Deck } from '../types/deck';
import { parsePlayerLog, parsePlayerLogDecks, parsePlayerLogWildcards } from '../utils/arenaParser';
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
  Trash2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CollectionSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCollection: (collection: UserCollection) => void;
  onSyncDecks: (decks: Deck[]) => void;
  onSyncWildcards: (inventory: WildcardInventory) => void;
  currentWildcards: WildcardInventory;
  currentCollectionCount: number;
}

export const CollectionSyncModal: React.FC<CollectionSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncCollection,
  onSyncDecks,
  onSyncWildcards,
  currentWildcards
}) => {
  const [logText, setLogText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
    deckCount?: number;
    cardCount?: number;
  } | null>(null);

  // Manual wildcard adjust state
  const [wcCommon, setWcCommon] = useState(currentWildcards?.common ?? 0);
  const [wcUncommon, setWcUncommon] = useState(currentWildcards?.uncommon ?? 0);
  const [wcRare, setWcRare] = useState(currentWildcards?.rare ?? 0);
  const [wcMythic, setWcMythic] = useState(currentWildcards?.mythic ?? 0);
  const [isWcSaved, setIsWcSaved] = useState(false);

  React.useEffect(() => {
    if (currentWildcards) {
      setWcCommon(currentWildcards.common);
      setWcUncommon(currentWildcards.uncommon);
      setWcRare(currentWildcards.rare);
      setWcMythic(currentWildcards.mythic);
    }
  }, [currentWildcards]);

  const handleManualSaveWildcards = () => {
    onSyncWildcards({
      common: Math.max(0, wcCommon),
      uncommon: Math.max(0, wcUncommon),
      rare: Math.max(0, wcRare),
      mythic: Math.max(0, wcMythic)
    });
    setIsWcSaved(true);
    setTimeout(() => setIsWcSaved(false), 2500);
  };

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

      // 3. Try parsing wildcard inventory from Player.log
      const wildcardsFound = parsePlayerLogWildcards(text);
      if (wildcardsFound) {
        onSyncWildcards(wildcardsFound);
      }

      const totalUniqueCards = Object.keys(mergedCollection).length;
      const totalDecksFound = deckResult.decks.length;

      if (totalDecksFound > 0 || totalUniqueCards > 0 || wildcardsFound) {
        if (totalDecksFound > 0) {
          onSyncDecks(deckResult.decks);
        }
        if (totalUniqueCards > 0) {
          onSyncCollection(mergedCollection);
        }

        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        let summaryText = `Account sync successful!`;
        if (totalDecksFound > 0 || totalUniqueCards > 0) {
          summaryText += ` Synced ${totalDecksFound} deck(s) and ${totalUniqueCards} unique card(s).`;
        }
        if (wildcardsFound) {
          summaryText += ` Wildcards updated: ${wildcardsFound.common} Common, ${wildcardsFound.uncommon} Uncommon, ${wildcardsFound.rare} Rare, ${wildcardsFound.mythic} Mythic.`;
        }

        setStatusMessage({
          type: 'success',
          text: summaryText,
          deckCount: totalDecksFound,
          cardCount: totalUniqueCards
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'No valid decks, cards, or wildcards found in this input. Make sure to enable Detailed Logs in MTG Arena Options > Account before copying Player.log, or drop an exported inventory JSON.'
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

  const handleDropFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) {
        await handleProcessLog(content);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleDropFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDropFile(file);
    }
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
        <div className="bg-[#0d1017] border border-white/5 rounded-2xl p-4 text-xs text-stone-300 space-y-2.5 shadow-inner">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>How to sync all your decks & cards from MTG Arena</span>
          </div>
          <ol className="text-stone-400 leading-relaxed list-decimal list-inside space-y-1">
            <li>In MTG Arena, open <strong>Options &gt; Account</strong> and check <strong>"Detailed Logs (Plugin Support)"</strong>.</li>
            <li>Click on your <strong>Decks</strong> tab in MTG Arena once so Arena broadcasts your deck library.</li>
            <li>Locate your log in Windows File Explorer:</li>
          </ol>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>Main log (if Arena was just open):</span>
            </div>
            <code className="block bg-black/50 px-2.5 py-1.5 rounded-lg text-[11px] text-amber-300 border border-white/10 select-all font-mono break-all font-bold">
              %APPDATA%\..\LocalLow\Wizards Of The Coast\MTGA\Player.log
            </code>
            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
              <span>Previous session (contains full library if Arena was restarted):</span>
            </div>
            <code className="block bg-black/50 px-2.5 py-1.5 rounded-lg text-[11px] text-cyan-300 border border-white/10 select-all font-mono break-all font-bold">
              %APPDATA%\..\LocalLow\Wizards Of The Coast\MTGA\Player-prev.log
            </code>
          </div>
          <p className="text-[11px] text-amber-300/90 pt-1 border-t border-white/5">
            ⚡ <strong>Full 50,000+ Collection Export:</strong> For players using <em>MTGA Assistant</em>, <em>17Lands</em>, or <em>Untapped</em>, you can also drop your exported <code>collection.json</code> or inventory dump to sync every card in your vault beyond your decks!
          </p>
        </div>

        {/* Upload Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition shadow-sm ${
            isDragOver 
              ? 'border-amber-400 bg-amber-500/20 scale-[1.01]' 
              : 'border-amber-500/40 hover:border-amber-400 bg-[#0d1017]/50 hover:bg-[#0d1017]'
          }`}
        >
          <input
            type="file"
            id="logFileInput"
            accept=".log,.txt,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="logFileInput" className="cursor-pointer space-y-2 block">
            <FileText className={`w-8 h-8 mx-auto transition-transform ${isDragOver ? 'scale-110 text-amber-300' : 'text-amber-400'}`} />
            <div className="text-sm font-bold text-stone-200">
              {isDragOver ? 'Drop file to import now' : 'Click to select Player.log or drag & drop here'}
            </div>
            <p className="text-xs text-stone-500">Supports Player.log, Player-prev.log, or tracker JSON</p>
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

        {/* Manual Wildcard Stash Quick Editor */}
        <div className="bg-[#090c12] border border-amber-500/20 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-fantasy font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Wildcard Stash Quick-Edit</span>
            </span>
            {isWcSaved ? (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3 h-3" /> Stash Updated!
              </span>
            ) : (
              <span className="text-[10px] text-stone-400">
                Adjust counts directly or import from log above
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-black/50 border border-white/10 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-stone-300 font-bold mb-1">
                <div className="w-2 h-2 rounded-full bg-stone-400" /> Common
              </div>
              <input
                type="number"
                min="0"
                value={wcCommon}
                onChange={e => setWcCommon(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-none"
              />
            </div>
            <div className="bg-black/50 border border-cyan-500/30 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-300 font-bold mb-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-cyan-400/50" /> Uncommon
              </div>
              <input
                type="number"
                min="0"
                value={wcUncommon}
                onChange={e => setWcUncommon(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-none"
              />
            </div>
            <div className="bg-black/50 border border-amber-500/30 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-amber-300 font-bold mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-amber-400/50" /> Rare
              </div>
              <input
                type="number"
                min="0"
                value={wcRare}
                onChange={e => setWcRare(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-none"
              />
            </div>
            <div className="bg-black/50 border border-orange-500/30 rounded-xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-orange-300 font-bold mb-1">
                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-orange-500/50" /> Mythic
              </div>
              <input
                type="number"
                min="0"
                value={wcMythic}
                onChange={e => setWcMythic(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={handleManualSaveWildcards}
              className="px-3 py-1 bg-gradient-to-r from-amber-500/30 to-orange-500/30 hover:from-amber-500/40 hover:to-orange-500/40 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition shadow-sm"
            >
              Update Stash Numbers
            </button>
          </div>
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

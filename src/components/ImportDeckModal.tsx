import React, { useState, useEffect, useRef } from 'react';
import { Deck } from '../types/deck';
import { FormatType } from '../types/card';
import { parseArenaFormatAsync, ParsedDeckResult } from '../utils/arenaParser';
import { 
  X, 
  Clipboard, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImportDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeck: (deck: Deck, openInBuilder: boolean) => void;
}

export const ImportDeckModal: React.FC<ImportDeckModalProps> = ({
  isOpen,
  onClose,
  onSaveDeck
}) => {
  const [deckText, setDeckText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [format, setFormat] = useState<FormatType>('brawl');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedDeckResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDeckText('');
      setDeckName('');
      setParsedResult(null);
      setParseError(null);
      setIsParsing(false);
    }
  }, [isOpen]);

  // Live auto-parse when text changes
  useEffect(() => {
    if (!deckText.trim()) {
      setParsedResult(null);
      setParseError(null);
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const result = await parseArenaFormatAsync(deckText);
        setParsedResult(result);
        setFormat(result.detectedFormat);
        if (!deckName || deckName === 'Imported Arena Deck') {
          setDeckName(result.suggestedTitle);
        }
        setParseError(null);
      } catch (err) {
        console.error('Failed to parse deck text:', err);
        setParseError('Unable to parse card list. Please verify the Arena export format.');
      } finally {
        setIsParsing(false);
      }
    }, 350);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [deckText]);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        setDeckText(clipText.trim());
      }
    } catch {
      // Fallback if clipboard API permission denied
      alert('Clipboard access was blocked. Please paste directly into the box using Ctrl+V.');
    }
  };

  const handleCommit = (openInBuilder: boolean) => {
    if (!parsedResult) return;

    const mainTotal = parsedResult.mainboard.reduce((s, i) => s + i.quantity, 0);
    if (mainTotal === 0 && !parsedResult.commander) {
      setParseError('Deck has no valid cards to import.');
      return;
    }

    const newDeck: Deck = {
      id: `imported-deck-${Date.now()}`,
      name: deckName.trim() || parsedResult.suggestedTitle || 'Imported Arena Deck',
      format: format,
      commander: parsedResult.commander,
      mainboard: parsedResult.mainboard,
      sideboard: parsedResult.sideboard,
      isImported: true,
      source: 'imported',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    onSaveDeck(newDeck, openInBuilder);
    onClose();
  };

  const totalMainCards = parsedResult 
    ? parsedResult.mainboard.reduce((s, i) => s + i.quantity, 0) 
    : 0;
  const totalSideCards = parsedResult 
    ? parsedResult.sideboard.reduce((s, i) => s + i.quantity, 0) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="sanctum-panel rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5d8b8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-fantasy font-black text-lg text-stone-900">Import Deck from MTG Arena</h2>
              <p className="text-xs text-stone-500">Paste your exported Arena deck list or click Paste from Clipboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Paste from Clipboard & Clear */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePasteClipboard}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#faf6ed] hover:bg-white text-stone-800 border border-[#dfd4be] hover:border-amber-400 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Clipboard className="w-3.5 h-3.5 text-amber-600" />
            <span>Paste from Clipboard</span>
          </button>

          {deckText && (
            <button
              onClick={() => setDeckText('')}
              className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2"
            >
              Clear Text
            </button>
          )}
        </div>

        {/* Text Area */}
        <div className="space-y-1.5 relative">
          <textarea
            value={deckText}
            onChange={e => setDeckText(e.target.value)}
            placeholder={`Commander\n1 Atraxa, Grand Unifier (ONE) 196\n\nDeck\n1 Sol Ring (C21) 263\n4 Lightning Bolt (STA) 42\n...`}
            className="w-full h-36 bg-white border border-[#e5d8b8] rounded-2xl p-3.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-500 placeholder-stone-400 shadow-inner resize-none"
          />
          {isParsing && (
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50/90 px-2.5 py-1 rounded-lg border border-amber-200/60 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Resolving cards...</span>
            </div>
          )}
        </div>

        {/* Parse Error Banner */}
        {parseError && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2 font-medium shadow-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Live Detected Preview */}
        {parsedResult && !isParsing && (
          <div className="bg-[#faf6ed] border border-[#e8dfc8] rounded-2xl p-4 space-y-4 shadow-sm animate-in fade-in duration-150">
            {/* Deck Configuration: Name & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-8">
                <label className="text-[10px] font-fantasy font-bold text-stone-600 uppercase tracking-wider block mb-1">
                  Deck Title
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={e => setDeckName(e.target.value)}
                  placeholder="Deck Name..."
                  className="w-full bg-white border border-[#e5d8b8] rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] font-fantasy font-bold text-stone-600 uppercase tracking-wider block mb-1">
                  Format
                </label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value as FormatType)}
                  className="w-full bg-white border border-[#e5d8b8] rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500 capitalize shadow-inner"
                >
                  <option value="brawl">Brawl</option>
                  <option value="standard">Standard</option>
                  <option value="historic">Historic</option>
                  <option value="timeless">Timeless</option>
                  <option value="explorer">Pioneer / Explorer</option>
                  <option value="alchemy">Alchemy</option>
                </select>
              </div>
            </div>

            {/* Validation Breakdown Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e8dfc8]/80 text-xs">
              <div className="flex items-center gap-4">
                {/* Commander Preview Badge */}
                {parsedResult.commander ? (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold text-stone-900">
                      Commander: <strong className="text-amber-800">{parsedResult.commander.card.name}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-stone-500 font-medium">
                    No Commander (Constructed 60-card list)
                  </div>
                )}

                {/* Counts */}
                <div className="flex items-center gap-2 font-bold text-stone-700">
                  <span className="bg-white px-2 py-0.5 rounded-lg border border-[#e5d8b8]">
                    Mainboard: {totalMainCards}
                  </span>
                  {totalSideCards > 0 && (
                    <span className="bg-white px-2 py-0.5 rounded-lg border border-[#e5d8b8]">
                      Sideboard: {totalSideCards}
                    </span>
                  )}
                </div>
              </div>

              {parsedResult.unrecognizedCards.length > 0 && (
                <div className="text-amber-800 text-[11px] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{parsedResult.unrecognizedCards.length} unindexed card(s) skipped</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-200 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCommit(false)}
              disabled={!parsedResult || isParsing || totalMainCards === 0}
              className="px-4 py-2 bg-[#faf6ed] hover:bg-white text-stone-900 font-extrabold text-xs rounded-xl border border-[#dfd4be] hover:border-amber-400 disabled:opacity-50 transition shadow-sm"
            >
              Save to My Decks
            </button>
            <button
              onClick={() => handleCommit(true)}
              disabled={!parsedResult || isParsing || totalMainCards === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm border border-amber-300/60 transition"
            >
              <span>Save &amp; Open in Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportDeckModal;

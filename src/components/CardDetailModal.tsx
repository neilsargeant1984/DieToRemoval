import React, { useState, useEffect } from 'react';
import { Card } from '../types/card';
import { UserCollection } from '../types/collection';
import { X, BookOpen, Sparkles, RefreshCw, Crown, Palette, Layers, Check } from 'lucide-react';
import { calculateSynergy } from '../utils/synergyGraph';
import { explainSynergy } from '../utils/synergyExplainer';
import { getCardRoleChips, classifyCardRoles } from '../utils/roleClassifier';
import { CardImage } from './CardImage';
import { FormattedOracleText } from './FormattedOracleText';
import { getCardFaceData, hasMultipleFaces } from '../utils/cardFaceUtils';
import { OwnershipPips } from './OwnershipPips';
import { getCardOwnedCount, setCardOwnedCount } from '../services/ownershipService';
import { transformScryfallCard, getScryfallHeaders } from '../services/scryfallService';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  onAddCard: (card: Card, toSideboard?: boolean) => void;
  commander?: Card;
  userCollection?: UserCollection;
  onUpdateCollection?: (col: UserCollection) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card: initialCard,
  onClose,
  onAddCard,
  commander,
  userCollection = {},
  onUpdateCollection
}) => {
  const [selectedPrinting, setSelectedPrinting] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [alternatePrints, setAlternatePrints] = useState<Card[]>([]);
  const [isLoadingPrints, setIsLoadingPrints] = useState<boolean>(false);

  // Active card is selected alternate printing or initial card
  const currentCard = selectedPrinting || initialCard;

  useEffect(() => {
    setSelectedPrinting(null);
    setIsFlipped(false);
    setAlternatePrints([]);

    if (!initialCard) return;

    // Fetch all printings and alternate arts available on MTG Arena for this card
    let isCancelled = false;
    const fetchPrints = async () => {
      setIsLoadingPrints(true);
      try {
        const cleanName = initialCard.name.replace(/^A-/, '').trim();
        const url = `https://api.scryfall.com/cards/search?q=!%22${encodeURIComponent(cleanName)}%22+game:arena&unique=prints`;
        const res = await fetch(url, { headers: getScryfallHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.data)) {
            const parsed = data.data.map(transformScryfallCard);
            // Filter to valid unique printings
            setAlternatePrints(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch alternate printings for card:', err);
      } finally {
        if (!isCancelled) setIsLoadingPrints(false);
      }
    };

    fetchPrints();
    return () => {
      isCancelled = true;
    };
  }, [initialCard?.id, initialCard?.name]);

  if (!currentCard) return null;

  const isMultiFace = hasMultipleFaces(currentCard);
  const faceData = getCardFaceData(currentCard, isFlipped);
  const displayName = faceData.name;
  const displayTypeLine = faceData.typeLine;
  const displayOracleText = faceData.oracleText;
  const displayImageUrl = faceData.imageUrl;

  const isCommanderCard = Boolean(
    commander && (currentCard.id === commander.id || currentCard.name === commander.name)
  );

  const synergyMatch = (!isCommanderCard && commander) ? calculateSynergy(commander, currentCard) : null;
  const roleChips = getCardRoleChips(currentCard, commander);
  const cardRoles = classifyCardRoles(currentCard, commander);

  const synergyReason = isCommanderCard
    ? (cardRoles.explanation.length > 0 
        ? cardRoles.explanation.join(' • ') 
        : 'Primary Commander orchestrating the deck strategy')
    : (commander 
        ? (synergyMatch 
            ? explainSynergy(commander, synergyMatch) 
            : (cardRoles.explanation[0] || `On-color support card for ${commander.name}`))
        : null);

  const ownedCopies = getCardOwnedCount(currentCard, userCollection);

  const handleSetCopies = (count: number) => {
    const updated = setCardOwnedCount(currentCard, count, userCollection);
    if (onUpdateCollection) {
      onUpdateCollection(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="arena-panel rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-full bg-[#161b26] hover:bg-[#1f2637] transition border border-[#c5a059]/30 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Card Image & Actions */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center">
          <div className="relative w-full aspect-[5/7] group">
            <div className="w-full h-full">
              <CardImage
                src={displayImageUrl}
                cardName={displayName}
                alt={displayName}
                className="w-full h-full rounded-2xl shadow-xl border border-black/60 object-cover bg-black transition-opacity duration-200"
              />
            </div>

            {isMultiFace && (
              <button
                type="button"
                onClick={() => setIsFlipped(prev => !prev)}
                className="absolute top-2.5 right-2.5 bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-400/50 p-2 rounded-xl backdrop-blur-md shadow-lg transition flex items-center gap-1.5 text-[11px] font-bold z-10"
                title={isFlipped ? 'Show Front Face' : 'Show Reverse Face'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Front' : 'Reverse'}</span>
              </button>
            )}
          </div>

          {/* Interactive Ownership Marking Pips */}
          <div className="mt-3 w-full bg-[#0d111a] border border-[#c5a059]/30 rounded-2xl p-2.5 flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-between w-full text-[11px]">
              <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                In MTG Arena Vault:
              </span>
              <span className={`font-mono font-bold ${ownedCopies >= 4 ? 'text-emerald-400' : ownedCopies > 0 ? 'text-amber-400' : 'text-stone-500'}`}>
                {ownedCopies}/4 {ownedCopies >= 4 ? 'Playset' : 'Copies'}
              </span>
            </div>

            {/* Quick 0x to 4x Buttons */}
            <div className="grid grid-cols-5 gap-1 w-full pt-1">
              {[0, 1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSetCopies(num)}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    ownedCopies === num
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black scale-102'
                      : 'bg-white/5 hover:bg-white/10 text-stone-300'
                  }`}
                  title={`Mark as ${num} copies owned`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>

          {/* Add to Deck Buttons */}
          <div className="mt-3 flex gap-2 w-full">
            {isCommanderCard ? (
              <div className="w-full py-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/50 rounded-xl text-center text-amber-300 font-fantasy font-black text-xs flex items-center justify-center gap-2 shadow-md">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Active Deck Commander</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    onAddCard(currentCard, false);
                    onClose();
                  }}
                  className="btn-mythic-spark flex-1 py-2 text-slate-950 font-black text-xs rounded-xl shadow-md transition hover:scale-102"
                >
                  + Mainboard
                </button>
                <button
                  onClick={() => {
                    onAddCard(currentCard, true);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-[#161b26] hover:bg-[#202737] text-slate-200 font-bold text-xs rounded-xl border border-[#c5a059]/30 transition"
                >
                  + Sideboard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Detailed Metadata, Alternate Arts & Spellbook */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-fantasy font-black text-xl text-slate-100">{displayName}</h2>
              {currentCard.isDigitalOnly && (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/50 px-2.5 py-0.5 rounded-full shadow-sm">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Digital Only
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-medium">
              {displayTypeLine} • Mana Value: {currentCard.cmc}
              {faceData.loyalty && ` • Starting Loyalty: ${faceData.loyalty}`}
              {faceData.power !== undefined && faceData.toughness !== undefined && ` • ${faceData.power}/${faceData.toughness}`}
            </div>
          </div>

          {/* Alternate Art & Printings on MTG Arena */}
          {alternatePrints.length > 1 && (
            <div className="bg-[#10141f] border border-[#c5a059]/30 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-fantasy font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Available Art Styles & Printings ({alternatePrints.length})</span>
                </span>
                <span className="text-[10px] text-stone-400">
                  Select your preferred art for deck
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {alternatePrints.map(print => {
                  const isSelected = (currentCard.id === print.id) || (currentCard.set === print.set && currentCard.collectorNumber === print.collectorNumber);
                  return (
                    <button
                      key={print.id}
                      type="button"
                      onClick={() => setSelectedPrinting(print)}
                      className={`relative flex-shrink-0 w-14 aspect-[5/7] rounded-lg overflow-hidden border transition-all duration-150 ${
                        isSelected 
                          ? 'ring-2 ring-amber-400 border-amber-300 scale-105 shadow-md' 
                          : 'border-white/10 hover:border-amber-400/60 opacity-70 hover:opacity-100'
                      }`}
                      title={`${print.setName} #${print.collectorNumber}`}
                    >
                      <CardImage
                        src={print.imageUrl}
                        cardName={print.name}
                        alt={print.name}
                        className="w-full h-full object-cover bg-black"
                      />
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center text-stone-300 py-0.5">
                        {print.set}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Oracle Text */}
          <div className="bg-[#0e121a] border border-[#c5a059]/25 rounded-2xl p-4 text-sm text-slate-200 leading-relaxed shadow-sm font-sans">
            <FormattedOracleText text={displayOracleText} />
          </div>

          {/* Commander Profile or Synergy Breakdown */}
          {commander && (
            <div className="bg-[#131722] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  {isCommanderCard ? (
                    <>
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Commander Strategic Profile</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Commander Synergy: {commander.name}</span>
                    </>
                  )}
                </div>
                {!isCommanderCard && synergyMatch && (
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
              <span className="font-mono font-bold text-amber-400">{currentCard.arenaId || 'Mapped'}</span>
            </div>
            <div className="bg-[#0e121a] p-2.5 rounded-xl border border-[#c5a059]/20">
              <span className="text-slate-400 block">Set & Number</span>
              <span className="font-mono text-slate-200 font-bold">{currentCard.set} #{currentCard.collectorNumber}</span>
            </div>
          </div>

          {/* Arena Format Legality Matrix */}
          <div>
            <span className="text-xs font-fantasy font-bold uppercase text-[#c5a059] tracking-wider block mb-1.5">
              Arena Format Legalities
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {Object.entries(currentCard.legalities).map(([fmt, isLegal]) => (
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
          {currentCard.spellbook && currentCard.spellbook.length > 0 && (
            <div className="pt-3 border-t border-[#c5a059]/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Spellbook Cards ({currentCard.spellbook.length})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                In MTG Arena, playing or activating this card allows you to draft or conjure one of these specific cards:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {currentCard.spellbook.map((sb, idx) => (
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

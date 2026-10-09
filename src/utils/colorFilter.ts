import { Card } from '../types/card';

/**
 * Checks whether a card matches the given MTG Arena-style color filter selection.
 * 
 * Rules:
 * - selectedColors can contain 'W', 'U', 'B', 'R', 'G', 'C' (Colorless), and 'M' (Multicolor).
 * - Empty selection matches all cards.
 * - Selecting base colors (e.g. ['U', 'B']) matches mono-blue, mono-black, and UB cards,
 *   rejecting any off-color cards (e.g. cards with R, G, or W) and rejecting colorless (unless 'C' is selected).
 * - Selecting base colors + 'M' (e.g. ['U', 'B', 'M']) matches only multicolor cards within those colors (Dimir UB).
 * - Selecting 1 base color + 'M' (e.g. ['U', 'M']) matches multicolor cards containing that color.
 * - Selecting only 'M' matches all cards with 2 or more colors.
 * - Selecting only 'C' matches cards with 0 colors (colorless).
 * - Selecting 'C' alongside base colors includes colorless cards.
 */
export type ColorMatchMode = 'selected' | 'any' | 'exact' | 'multi_only';

export function matchesColorFilter(
  card: Card, 
  selectedColors: string[],
  colorMode: ColorMatchMode = 'selected'
): boolean {
  if (!selectedColors || selectedColors.length === 0) return true;

  const cardColors: string[] = (card.colors && card.colors.length > 0)
    ? card.colors
    : (card.colorIdentity || []);

  const normalSelected = selectedColors.filter(c => ['W', 'U', 'B', 'R', 'G'].includes(c));
  const hasColorless = selectedColors.includes('C');
  const hasMulti = selectedColors.includes('M');

  const isCardColorless = cardColors.length === 0;
  const isCardMulti = cardColors.length >= 2;

  // Mode: "any" (Match Any Color)
  if (colorMode === 'any') {
    const matchesNormal = normalSelected.length > 0 && cardColors.some(c => normalSelected.includes(c));
    const matchesC = hasColorless && isCardColorless;
    const matchesM = hasMulti && isCardMulti;
    return matchesNormal || matchesC || matchesM;
  }

  // Mode: "exact" (Match Exact Colors)
  if (colorMode === 'exact') {
    if (hasColorless && !hasMulti && normalSelected.length === 0) return isCardColorless;
    if (normalSelected.length === 0) return true;
    return normalSelected.length === cardColors.length && cardColors.every(c => normalSelected.includes(c));
  }

  // Mode: "multi_only" (Multicolor Only)
  if (colorMode === 'multi_only') {
    if (!isCardMulti) return false;
    if (normalSelected.length === 0) return true;
    return cardColors.every(c => normalSelected.includes(c));
  }

  // Default Arena Mode: "selected" (Match Selected Colors subset)
  // 1. Only C and/or M selected (no base colors)
  if (normalSelected.length === 0) {
    if (hasColorless && hasMulti) {
      return isCardColorless || isCardMulti;
    }
    if (hasColorless) {
      return isCardColorless;
    }
    if (hasMulti) {
      return isCardMulti;
    }
    return true;
  }

  // 2. Base colors + Multi ('M')
  if (hasMulti) {
    if (!isCardMulti) return false;

    // Single color + Multi (e.g. U + M): any multicolor card containing U
    if (normalSelected.length === 1) {
      return cardColors.includes(normalSelected[0]);
    }

    // 2+ colors + Multi (e.g. U + B + M): multicolor cards restricted to selected colors
    return cardColors.every(c => normalSelected.includes(c));
  }

  // 3. Base colors without Multi
  const onlySelectedColors = cardColors.every(c => normalSelected.includes(c));
  const hasAtLeastOne = cardColors.some(c => normalSelected.includes(c));

  if (hasColorless) {
    return isCardColorless || (onlySelectedColors && hasAtLeastOne);
  }

  return !isCardColorless && onlySelectedColors && hasAtLeastOne;
}

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Deck } from '../types/deck';
import { UserCollection, WildcardInventory } from '../types/collection';
import { generateDeckId, isValidUuid } from '../utils/uuid';

export interface CloudDeckRecord {
  id: string;
  user_id: string;
  name: string;
  format: string;
  description?: string;
  commander?: any;
  mainboard: any[];
  sideboard: any[];
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const deckCloudService = {
  // Save or update deck in Supabase
  async saveDeck(deck: Deck, isPublic: boolean = false): Promise<{ data: Deck | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured yet.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'You must be signed in to save decks to the cloud.' };
    }

    try {
      // Ensure we always provide a valid RFC-4122 UUID so PostgreSQL does not reject with 22P02
      const targetId = isValidUuid(deck.id) ? deck.id : generateDeckId();

      const payload = {
        id: targetId,
        user_id: user.id,
        name: deck.name,
        format: deck.format,
        description: deck.description || '',
        commander: deck.commander || null,
        mainboard: deck.mainboard || [],
        sideboard: deck.sideboard || [],
        tags: deck.tags || [],
        is_public: isPublic,
        updated_at: deck.updatedAt || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('decks')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const savedDeck: Deck = {
        id: data.id,
        name: data.name,
        format: data.format,
        commander: data.commander,
        mainboard: data.mainboard,
        sideboard: data.sideboard,
        description: data.description,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      return { data: savedDeck, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to save deck to cloud.' };
    }
  },

  // Load all decks created by the logged-in user
  async getUserDecks(): Promise<{ data: Deck[]; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { data: [], error: 'Supabase is not configured yet.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      const formatted: Deck[] = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        format: d.format,
        commander: d.commander,
        mainboard: d.mainboard,
        sideboard: d.sideboard,
        description: d.description,
        tags: d.tags,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));

      return { data: formatted, error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  },

  /**
   * Two-way synchronization between local browser decks and Supabase Cloud:
   * 1. Pulls all remote decks from Supabase for this user.
   * 2. Pushes any local decks that don't exist remotely (or have legacy non-UUID IDs).
   * 3. Merges them, resolving any conflicts by latest updatedAt timestamp.
   * 4. Returns the unified list of decks.
   */
  async syncAllDecks(localDecks: Deck[]): Promise<{ syncedDecks: Deck[]; uploadedCount: number; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { syncedDecks: localDecks, uploadedCount: 0, error: 'Supabase not configured' };
    }

    const { data: remoteDecks, error } = await this.getUserDecks();
    if (error) {
      return { syncedDecks: localDecks, uploadedCount: 0, error };
    }

    const remoteMap = new Map<string, Deck>();
    remoteDecks.forEach(d => remoteMap.set(d.id, d));

    const finalDecks: Deck[] = [];
    let uploadedCount = 0;

    // Check each local deck
    for (const localDeck of localDecks) {
      // If the deck is a blank initial placeholder with 0 cards, skip pushing to cloud
      if (localDeck.id.startsWith('default-') && localDeck.mainboard.length === 0 && !localDeck.commander) {
        continue;
      }

      const remoteMatch = isValidUuid(localDeck.id) ? remoteMap.get(localDeck.id) : null;

      if (!remoteMatch) {
        // Local deck is not on the cloud yet -> upload it!
        const { data: saved, error: saveErr } = await this.saveDeck(localDeck);
        if (saved && !saveErr) {
          finalDecks.push(saved);
          remoteMap.set(saved.id, saved);
          uploadedCount++;
        } else {
          // If cloud upload failed, keep local deck so user doesn't lose data
          finalDecks.push(localDeck);
        }
      } else {
        // Exists in both: choose the most recently updated
        const localTime = new Date(localDeck.updatedAt || 0).getTime();
        const remoteTime = new Date(remoteMatch.updatedAt || 0).getTime();

        if (localTime > remoteTime) {
          await this.saveDeck(localDeck);
          finalDecks.push(localDeck);
        } else {
          finalDecks.push(remoteMatch);
        }
        // Remove from map to indicate it has been processed
        remoteMap.delete(remoteMatch.id);
      }
    }

    // Add any remaining remote decks that were not in local storage
    for (const remainingRemote of remoteMap.values()) {
      finalDecks.push(remainingRemote);
    }

    // Sort by updated_at descending
    finalDecks.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    return { syncedDecks: finalDecks, uploadedCount, error: null };
  },

  // Delete a deck from Supabase
  async deleteDeck(deckId: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    if (!isValidUuid(deckId)) {
      // Local-only deck without UUID, deletion only applies locally
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Save collection & wildcard stash to cloud
  async saveCollection(collection: UserCollection, inventory: WildcardInventory): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not signed in' };
    }

    try {
      const { error } = await supabase
        .from('user_collections')
        .upsert({
          user_id: user.id,
          collection_data: collection,
          wildcards: inventory,
          updated_at: new Date().toISOString()
        });

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Load collection from cloud
  async getCollection(): Promise<{ collection: UserCollection | null; inventory: WildcardInventory | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { collection: null, inventory: null, error: 'Supabase not configured' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { collection: null, inventory: null, error: 'Not signed in' };
    }

    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { collection: null, inventory: null, error: error.message };
      }

      if (!data) {
        return { collection: null, inventory: null, error: null };
      }

      return {
        collection: data.collection_data as UserCollection,
        inventory: data.wildcards as WildcardInventory,
        error: null
      };
    } catch (err: any) {
      return { collection: null, inventory: null, error: err.message };
    }
  }
};

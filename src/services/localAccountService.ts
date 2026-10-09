import { generateDeckId } from '../utils/uuid';

export interface LocalUserAccount {
  id: string;
  email: string;
  username: string;
  isCloudSynced: boolean;
  createdAt: string;
  lastLoginAt: string;
  arenaTag?: string;
}

const STORAGE_KEY = 'arenaforge_user_account';

export const localAccountService = {
  /**
   * Get the active browser-stored user account
   */
  getLocalAccount(): LocalUserAccount | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as LocalUserAccount;
    } catch {
      return null;
    }
  },

  /**
   * Save or update the active browser account
   */
  saveLocalAccount(data: Partial<LocalUserAccount> & { email: string }): LocalUserAccount {
    const existing = this.getLocalAccount();
    const now = new Date().toISOString();

    const account: LocalUserAccount = {
      id: existing?.id || data.id || generateDeckId(),
      email: data.email.trim(),
      username: data.username?.trim() || existing?.username || data.email.split('@')[0],
      isCloudSynced: data.isCloudSynced ?? (existing?.isCloudSynced ?? false),
      createdAt: existing?.createdAt || now,
      lastLoginAt: now,
      arenaTag: data.arenaTag || existing?.arenaTag
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    return account;
  },

  /**
   * Synchronize the browser account when Supabase session is available
   */
  syncWithSupabaseUser(supabaseUser: any): LocalUserAccount {
    const now = new Date().toISOString();
    const email = supabaseUser.email || 'planeswalker@mtg.com';
    const username = supabaseUser.user_metadata?.username || email.split('@')[0];

    const account: LocalUserAccount = {
      id: supabaseUser.id,
      email: email,
      username: username,
      isCloudSynced: true,
      createdAt: supabaseUser.created_at || now,
      lastLoginAt: now
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    return account;
  },

  /**
   * Clear browser-stored account on explicit sign out
   */
  clearLocalAccount(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};

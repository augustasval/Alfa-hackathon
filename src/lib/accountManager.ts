import { Session } from '@supabase/supabase-js';

export interface StoredAccount {
  userId: string;
  email: string;
  fullName: string;
  role: 'parent' | 'student';
  session: {
    accessToken: string;
    refreshToken: string;
  };
}

const STORAGE_KEY = 'lovable_accounts';
const ACTIVE_ACCOUNT_KEY = 'lovable_active_account';

class AccountManager {
  private getAccounts(): StoredAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored accounts:', error);
      return [];
    }
  }

  private saveAccounts(accounts: StoredAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  }

  addAccount(session: Session, profile: { id: string; email: string; full_name: string; role: 'parent' | 'student' }): void {
    const accounts = this.getAccounts();
    
    // Remove existing account with same userId if present
    const filtered = accounts.filter(acc => acc.userId !== profile.id);
    
    const newAccount: StoredAccount = {
      userId: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      },
    };
    
    filtered.push(newAccount);
    this.saveAccounts(filtered);
    this.setActiveAccount(profile.id);
  }

  removeAccount(userId: string): void {
    const accounts = this.getAccounts();
    const filtered = accounts.filter(acc => acc.userId !== userId);
    this.saveAccounts(filtered);
    
    // If we removed the active account, clear active account
    if (this.getActiveAccount() === userId) {
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    }
  }

  getAccountsList(): StoredAccount[] {
    return this.getAccounts();
  }

  getAccount(userId: string): StoredAccount | undefined {
    const accounts = this.getAccounts();
    return accounts.find(acc => acc.userId === userId);
  }

  setActiveAccount(userId: string): void {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, userId);
  }

  getActiveAccount(): string | null {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  }

  clearAllAccounts(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  }

  hasMultipleAccounts(): boolean {
    return this.getAccounts().length > 1;
  }
}

export const accountManager = new AccountManager();

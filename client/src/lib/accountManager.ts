interface SavedAccount {
  email: string;
  sessionToken: string;
  lastUsed: string;
  role: string;
  roleLevel: number;
  companyName?: string;
  companyId?: number;
}

export class AccountManager {
  private static readonly STORAGE_KEY = 'aisentinel_saved_accounts';

  static saveAccount(account: Omit<SavedAccount, 'lastUsed'>): void {
    try {
      const savedAccounts = this.getSavedAccounts();
      
      // Remove existing account with same email
      const filteredAccounts = savedAccounts.filter(acc => acc.email !== account.email);
      
      // Add new account with current timestamp
      const newAccount: SavedAccount = {
        ...account,
        lastUsed: new Date().toISOString()
      };
      
      filteredAccounts.unshift(newAccount); // Add to beginning
      
      // Keep only last 5 accounts
      const limitedAccounts = filteredAccounts.slice(0, 5);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedAccounts));
      
      console.log('Account saved:', account.email);
    } catch (error) {
      console.error('Error saving account:', error);
    }
  }

  static getSavedAccounts(): SavedAccount[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const accounts = JSON.parse(stored) as SavedAccount[];
      
      // Sort by last used (most recent first)
      return accounts.sort((a, b) => 
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      );
    } catch (error) {
      console.error('Error loading saved accounts:', error);
      return [];
    }
  }

  static removeAccount(email: string): void {
    try {
      const savedAccounts = this.getSavedAccounts();
      const filteredAccounts = savedAccounts.filter(acc => acc.email !== email);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredAccounts));
      console.log('Account removed:', email);
    } catch (error) {
      console.error('Error removing account:', error);
    }
  }

  static updateLastUsed(email: string): void {
    try {
      const savedAccounts = this.getSavedAccounts();
      const updatedAccounts = savedAccounts.map(acc => 
        acc.email === email 
          ? { ...acc, lastUsed: new Date().toISOString() }
          : acc
      );
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedAccounts));
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  }

  static clearAllAccounts(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('All accounts cleared');
    } catch (error) {
      console.error('Error clearing accounts:', error);
    }
  }

  static hasMultipleAccounts(): boolean {
    return this.getSavedAccounts().length > 1;
  }

  static hasSavedAccounts(): boolean {
    return this.getSavedAccounts().length > 0;
  }

  static getMostRecentAccount(): SavedAccount | null {
    const accounts = this.getSavedAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }
}
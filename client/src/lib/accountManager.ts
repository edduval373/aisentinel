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
      console.log('💾 [ACCOUNT MANAGER] Starting to save account:', account.email);
      const savedAccounts = this.getSavedAccounts();
      console.log('💾 [ACCOUNT MANAGER] Current saved accounts before save:', savedAccounts.length);
      
      // Remove existing account with same email
      const filteredAccounts = savedAccounts.filter(acc => acc.email !== account.email);
      console.log('💾 [ACCOUNT MANAGER] After filtering duplicates:', filteredAccounts.length);
      
      // Add new account with current timestamp
      const newAccount: SavedAccount = {
        ...account,
        lastUsed: new Date().toISOString()
      };
      
      filteredAccounts.unshift(newAccount); // Add to beginning
      
      // Keep only last 5 accounts
      const limitedAccounts = filteredAccounts.slice(0, 5);
      console.log('💾 [ACCOUNT MANAGER] Final accounts to save:', limitedAccounts.length);
      
      const jsonData = JSON.stringify(limitedAccounts);
      localStorage.setItem(this.STORAGE_KEY, jsonData);
      console.log('💾 [ACCOUNT MANAGER] Saved to localStorage. Data length:', jsonData.length);
      
      // Verify the save
      const verification = localStorage.getItem(this.STORAGE_KEY);
      if (verification) {
        const verifiedAccounts = JSON.parse(verification);
        console.log('✅ [ACCOUNT MANAGER] Verification: Account saved successfully. Total:', verifiedAccounts.length);
        verifiedAccounts.forEach((acc: any, i: number) => {
          console.log(`✅ [ACCOUNT MANAGER] Verified Account ${i+1}:`, acc.email, 'Role:', acc.roleLevel);
        });
      } else {
        console.error('❌ [ACCOUNT MANAGER] CRITICAL: Failed to save to localStorage!');
      }
      
    } catch (error) {
      console.error('❌ [ACCOUNT MANAGER] Error saving account:', error);
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
// Authentication headers utility for API calls
export function getAuthHeaders(): Record<string, string> {
  console.log('🔍 [AUTH HEADERS] Getting authentication headers...');
  
  try {
    // Get session token from saved accounts
    const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
    if (!savedAccounts) {
      console.log('❌ [AUTH HEADERS] No saved accounts found');
      return {};
    }

    const accounts = JSON.parse(savedAccounts);
    const account = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || accounts[0];
    
    if (!account || !account.sessionToken) {
      console.log('❌ [AUTH HEADERS] No valid account session token found');
      return {};
    }

    const headers = {
      'Authorization': `Bearer ${account.sessionToken}`,
      'X-Session-Token': account.sessionToken
    };

    console.log('✅ [AUTH HEADERS] Headers created with token:', account.sessionToken.substring(0, 20) + '...');
    return headers;
  } catch (error) {
    console.error('❌ [AUTH HEADERS] Failed to get auth headers:', error);
    return {};
  }
}
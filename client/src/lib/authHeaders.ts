// Authentication header utilities for header-based auth
export function getAuthToken(): string | null {
  // Check localStorage for stored auth token
  if (typeof window !== 'undefined') {
    // First check direct authToken storage
    const directToken = localStorage.getItem('authToken');
    if (directToken) {
      return directToken;
    }
    
    // Fallback: check saved accounts for production session token
    try {
      const savedAccounts = localStorage.getItem('aisentinel_saved_accounts');
      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts);
        if (accounts.length > 0) {
          // Look for ed.duval15@gmail.com first, then any account
          const primaryAccount = accounts.find((acc: any) => acc.email === 'ed.duval15@gmail.com') || accounts[0];
          if (primaryAccount && primaryAccount.sessionToken && primaryAccount.sessionToken.startsWith('prod-')) {
            console.log('🔧 [AUTH HEADERS] Using session token from saved accounts:', primaryAccount.email);
            return primaryAccount.sessionToken;
          }
        }
      }
    } catch (error) {
      console.error('❌ [AUTH HEADERS] Failed to parse saved accounts:', error);
    }
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('🔧 [AUTH HEADERS] Token set in localStorage:', token.substring(0, 20) + '...');
    } else {
      localStorage.removeItem('authToken');
      console.log('🔧 [AUTH HEADERS] Token cleared from localStorage');
    }
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  const token = getAuthToken();
  if (token && token.startsWith('prod-')) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Session-Token'] = token;
  }
  
  return headers;
}

export function extractTokenFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('auth-token') || urlParams.get('session') || urlParams.get('sessionToken');
}

// Initialize auth token from URL if present
export function initializeAuthFromURL(): void {
  const urlToken = extractTokenFromURL();
  if (urlToken && urlToken.startsWith('prod-')) {
    setAuthToken(urlToken);
    
    // Clean URL by removing auth parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('auth-token');
    url.searchParams.delete('session');
    url.searchParams.delete('sessionToken');
    url.searchParams.delete('t');
    url.searchParams.delete('method');
    
    // Replace URL without reloading page
    window.history.replaceState({}, '', url.toString());
  }
}
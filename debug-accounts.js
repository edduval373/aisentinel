
// Create a debug console function for immediate account switching
window.debugSwitchAccount = function(email) {
  const accounts = JSON.parse(localStorage.getItem('aisentinel_saved_accounts') || '[]');
  const account = accounts.find(acc => acc.email === email);
  
  if (!account) {
    console.log('Account not found:', email);
    return;
  }
  
  console.log('DEBUG: Switching to', email, 'with token', account.sessionToken.substring(0, 20) + '...');
  
  // Clear existing session
  document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Set new session
  document.cookie = `sessionToken=${account.sessionToken}; path=/; samesite=lax; max-age=2592000`;
  
  console.log('DEBUG: Cookies after switch:', document.cookie);
  
  // Hard reload
  window.location.href = window.location.href;
};

console.log('DEBUG: Use debugSwitchAccount("ed.duval@duvalsolutions.net") to test switching');


// Simple account switching function
function switchToSecondAccount() {
  console.log('SWITCHING: Clearing current session...');
  document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  console.log('SWITCHING: Setting session for ed.duval@duvalsolutions.net...');  
  document.cookie = 'sessionToken=prod-1754052835575-289kvxqgl42h; path=/; samesite=lax; max-age=2592000';
  
  console.log('SWITCHING: Current cookies:', document.cookie);
  console.log('SWITCHING: Reloading page...');
  
  setTimeout(() => window.location.reload(), 1000);
}

console.log('Manual switch function loaded. Use: switchToSecondAccount()');


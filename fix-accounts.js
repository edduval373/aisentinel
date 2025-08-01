// Immediate account fix - run this in browser console
console.log('🚨 FIXING ACCOUNTS NOW');

// Direct localStorage manipulation
const accounts = [
  {
    email: 'ed.duval15@gmail.com',
    sessionToken: 'prod-1754052835575-289kvxqgl42h', // Current session
    role: 'Super User',
    roleLevel: 1000,
    companyName: 'Duval Solutions',
    lastUsed: new Date().toISOString()
  },
  {
    email: 'ed.duval@duvalsolutions.net',
    sessionToken: 'manual-second-account-' + Date.now(),
    role: 'Super User', 
    roleLevel: 1000,
    companyName: 'Duval Solutions',
    lastUsed: new Date(Date.now() - 1000).toISOString() // Slightly older
  }
];

// Save to localStorage
localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(accounts));

// Verify
const saved = localStorage.getItem('aisentinel_saved_accounts');
console.log('✅ Accounts saved:', JSON.parse(saved));

// Force refresh dropdown
window.dispatchEvent(new StorageEvent('storage', {
  key: 'aisentinel_saved_accounts',
  newValue: saved
}));

console.log('✅ Account fix complete - should see both accounts now');

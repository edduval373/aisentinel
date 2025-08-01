
// Emergency account saving fix
console.log('🚨 EMERGENCY FIX: Manually saving current account');
const AccountManager = {
  saveAccount: (account) => {
    try {
      const key = 'aisentinel_saved_accounts';
      const saved = localStorage.getItem(key);
      const accounts = saved ? JSON.parse(saved) : [];
      
      // Remove existing
      const filtered = accounts.filter(acc => acc.email !== account.email);
      
      // Add new
      const newAccount = { ...account, lastUsed: new Date().toISOString() };
      filtered.unshift(newAccount);
      
      // Save
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 5)));
      console.log('✅ Account saved:', account.email);
      return true;
    } catch (e) {
      console.error('❌ Save failed:', e);
      return false;
    }
  }
};

// Save current account
const cookies = document.cookie.split(';');
const sessionCookie = cookies.find(c => c.trim().startsWith('sessionToken='));
const sessionToken = sessionCookie ? sessionCookie.split('=')[1] : 'fallback-' + Date.now();

AccountManager.saveAccount({
  email: 'ed.duval15@gmail.com',
  sessionToken: sessionToken,
  role: 'Super User',
  roleLevel: 1000,
  companyName: 'Duval Solutions'
});

// Check result
const result = localStorage.getItem('aisentinel_saved_accounts');
console.log('📊 Final result:', result);



console.log('=== DIRECT ACCOUNT SWITCH TEST ===');
console.log('Current localStorage keys:', Object.keys(localStorage));

// Find the actual localStorage key being used
const keys = Object.keys(localStorage);
const accountKey = keys.find(k => k.includes('account') || k.includes('saved'));

if (accountKey) {
  console.log('Found account key:', accountKey);
  const data = localStorage.getItem(accountKey);
  console.log('Account data:', data);
  
  try {
    const accounts = JSON.parse(data);
    console.log('Parsed accounts count:', accounts.length);
    
    // Find second account
    const secondAccount = accounts.find(acc => acc.email.includes('duvalsolutions'));
    if (secondAccount) {
      console.log('Found second account:', secondAccount.email);
      console.log('Token:', secondAccount.sessionToken.substring(0, 20) + '...');
      
      // Clear and set cookie
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `sessionToken=${secondAccount.sessionToken}; path=/; samesite=lax; max-age=2592000`;
      
      console.log('Cookie set, reloading in 2 seconds...');
      setTimeout(() => window.location.reload(), 2000);
    }
  } catch (e) {
    console.error('Parse error:', e);
  }
} else {
  console.log('No account localStorage key found');
}


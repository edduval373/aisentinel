// Debug script to check localStorage accounts
const accounts = localStorage.getItem('aisentinel_saved_accounts');
console.log('Raw localStorage data:', accounts);

if (accounts) {
  const parsed = JSON.parse(accounts);
  console.log('Parsed accounts:', parsed);
  console.log('Number of accounts:', parsed.length);
  parsed.forEach((acc, i) => {
    console.log(`Account ${i + 1}:`, {
      email: acc.email,
      roleLevel: acc.roleLevel,
      lastUsed: acc.lastUsed
    });
  });
} else {
  console.log('No accounts found in localStorage');
}

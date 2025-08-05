// Debug localStorage account issue
console.log('=== LOCALSTORAGE DEBUG ===');
console.log('All localStorage keys:', Object.keys(localStorage));

// Check various possible keys
const possibleKeys = [
  'aisentinel_saved_accounts',
  'saved_accounts', 
  'accounts',
  'user_accounts'
];

possibleKeys.forEach(key => {
  const data = localStorage.getItem(key);
  console.log(`Key: ${key} = ${data ? 'EXISTS' : 'NULL'}`);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`  Parsed: ${Array.isArray(parsed) ? parsed.length + ' items' : typeof parsed}`);
      if (Array.isArray(parsed)) {
        parsed.forEach((item, i) => {
          console.log(`    ${i}: ${item.email || 'no email'}`);
        });
      }
    } catch (e) {
      console.log(`  Parse error: ${e.message}`);
    }
  }
});

// Create test accounts if none exist
const testAccounts = [
  {
    email: 'ed.duval15@gmail.com',
    sessionToken: '<PRODUCTION_TOKEN_REMOVED>',
    role: 'Super User',
    roleLevel: 1000,
    companyName: 'Duval Solutions',
    lastUsed: new Date().toISOString()
  },
  {
    email: 'ed.duval@duvalsolutions.net',
    sessionToken: '<PRODUCTION_TOKEN_REMOVED>',
    role: 'Super User', 
    roleLevel: 1000,
    companyName: 'Duval Solutions',
    lastUsed: new Date().toISOString()
  },
  {
    email: 'test@example.com',
    sessionToken: '<PRODUCTION_TOKEN_REMOVED>',
    role: 'User',
    roleLevel: 1,
    companyName: 'Test Company',
    lastUsed: new Date().toISOString()
  }
];

console.log('=== CREATING TEST ACCOUNTS ===');
localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(testAccounts));

// Verify
const verification = localStorage.getItem('aisentinel_saved_accounts');
if (verification) {
  const parsed = JSON.parse(verification);
  console.log('✅ Test accounts created:', parsed.length);
  parsed.forEach((acc, i) => {
    console.log(`  ${i+1}: ${acc.email} (${acc.role})`);
  });
} else {
  console.log('❌ Failed to create test accounts');
}
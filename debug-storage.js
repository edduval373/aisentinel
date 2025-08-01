console.log('=== ACCOUNT DEBUG ==='); 
const accounts = localStorage.getItem('aisentinel_saved_accounts'); 
console.log('Raw localStorage:', accounts); 
if (accounts) { 
  const parsed = JSON.parse(accounts); 
  console.log('Parsed accounts:', parsed); 
  console.log('Account count:', parsed.length); 
  parsed.forEach((acc, i) => console.log('Account', i+1, ':', acc.email, acc.roleLevel)); 
} else { 
  console.log('No accounts in localStorage'); 
}

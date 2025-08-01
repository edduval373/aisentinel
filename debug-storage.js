
// Debug localStorage directly
console.log('=== LOCALSTORAGE DEBUG ===');
console.log('Raw localStorage:', localStorage.getItem('aisentinel_saved_accounts'));
console.log('All localStorage keys:', Object.keys(localStorage));
for(let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log();
}
console.log('=== END DEBUG ===');


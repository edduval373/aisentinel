const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building client and server...');

try {
  // Build client
  console.log('Building client...');
  execSync('npm run build:client', { stdio: 'inherit' });
  
  // Build server
  console.log('Building server...');
  execSync('npm run build:server', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
#!/usr/bin/env node

// Simple build script for Vercel deployment
const { execSync } = require('child_process');

console.log('Building AI Sentinel for Vercel...');

try {
  // Build the client
  console.log('Building client...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Build the server
  console.log('Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
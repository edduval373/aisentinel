import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building client and server...');

try {
  // Build client with production config
  console.log('Building client...');
  execSync('vite build --config vite.config.production.ts', { stdio: 'inherit' });
  
  // Build server with correct esbuild command
  console.log('Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
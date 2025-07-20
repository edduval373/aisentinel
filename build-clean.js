import { execSync } from 'child_process';

console.log('Building application for Vercel...');

try {
  // Clean build for Vercel
  console.log('Building client...');
  execSync('vite build --config vite.config.production.ts', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
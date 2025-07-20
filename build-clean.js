import { build } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Building application for Vercel...');

try {
  // Use Vite API directly to avoid command line issues
  await build({
    configFile: path.resolve(__dirname, 'vite.config.production.ts'),
    mode: 'production'
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
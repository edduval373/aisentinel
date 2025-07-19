#!/usr/bin/env node
import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

async function buildForVercel() {
  try {
    console.log('Starting build process...');
    
    // Build the client
    console.log('Building React client...');
    await build({
      root: resolve(__dirname, 'client'),
      build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'client/src'),
          '@shared': resolve(__dirname, 'shared'),
          '@assets': resolve(__dirname, 'attached_assets'),
        },
      },
    });
    
    console.log('React client built successfully!');
    
    // Build the server
    console.log('Building Express server...');
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
    });
    
    console.log('Express server built successfully!');
    console.log('Build process completed!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForVercel();
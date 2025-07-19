#!/usr/bin/env node
import { build } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');

async function buildForVercel() {
  try {
    console.log('Building client with Vite...');
    
    // Build the client
    await build({
      root: resolve(__dirname, 'client'),
      build: {
        outDir: resolve(__dirname, 'dist/public'),
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
    
    console.log('Building server with esbuild...');
    
    // Build the server
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
      stdio: 'inherit',
      cwd: __dirname,
    });
    
    console.log('Build completed successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForVercel();
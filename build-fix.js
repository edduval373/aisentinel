#!/usr/bin/env node
// Custom build script to fix esbuild vite.config resolution issue

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  try {
    console.log('Building frontend...');
    await execAsync('npx vite build --config vite.config.production.ts');
    
    console.log('Building server with external vite.config...');
    await execAsync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:../vite.config --external:vite');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
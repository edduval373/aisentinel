#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building AI Sentinel with diagnostic tool...');

try {
  // Run the normal build process
  console.log('📦 Running Vite build...');
  execSync('vite build --config vite.config.production.ts', { stdio: 'inherit' });
  
  // Copy diagnostic file to build output
  console.log('📋 Copying diagnostic.html...');
  const sourcePath = path.join(__dirname, 'public', 'diagnostic.html');
  const destPath = path.join(__dirname, 'dist', 'public', 'diagnostic.html');
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log('✅ Diagnostic tool copied to build output');
  } else {
    console.warn('⚠️ diagnostic.html not found in public directory');
  }
  
  // Build server
  console.log('🔧 Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:../vite.config --external:vite', { stdio: 'inherit' });
  
  console.log('🎉 Build complete with diagnostic tool!');
  console.log('🔗 Diagnostic tool will be available at: /diagnostic.html');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
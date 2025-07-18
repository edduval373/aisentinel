#!/usr/bin/env node

// Deployment script for Vercel - alternative to automatic GitHub deployment
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Vercel deployment...');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Run this from the project root.');
  process.exit(1);
}

try {
  // Build the application
  console.log('📦 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if build was successful
  if (!fs.existsSync('dist/public/index.html')) {
    console.error('❌ Build failed - no index.html found in dist/public');
    process.exit(1);
  }
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Files ready for deployment:');
  console.log('   - Static files: dist/public/');
  console.log('   - Server bundle: dist/index.js');
  console.log('   - API handler: api/index.ts');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Commit these changes to GitHub');
  console.log('2. In Vercel dashboard, click "Deploy" manually');
  console.log('3. Or use: vercel --prod (if you have Vercel CLI)');
  
} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}
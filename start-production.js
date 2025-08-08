#!/usr/bin/env node

// Production startup script for Render deployment
// This ensures we start the correct production server

console.log('🚀 AI Sentinel - Starting production server...');
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 Port:', process.env.PORT || '10000');

try {
  // Import and run the production server bundle
  await import('./dist/production.js');
} catch (error) {
  console.error('❌ Failed to start production server:', error.message);
  console.error('Stack trace:', error.stack);
  
  // Try fallback to development server if production fails
  console.log('🔄 Attempting fallback startup...');
  try {
    await import('./server/production.js');
    console.log('✅ Fallback server started successfully');
  } catch (fallbackError) {
    console.error('❌ Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
}
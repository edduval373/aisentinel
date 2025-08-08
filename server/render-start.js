// Simple production startup file for Render
// This runs the compiled production bundle directly
console.log('Starting AI Sentinel production server...');

try {
  // Import and run the compiled production server
  await import('../dist/production.js');
  console.log('✅ Production server started successfully');
} catch (error) {
  console.error('❌ Failed to start production server:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
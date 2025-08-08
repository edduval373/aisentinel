// Simple production startup file for Render
// This avoids any import issues with vite.config

import('./production.js').then((module) => {
  console.log('Production server started successfully');
}).catch((error) => {
  console.error('Failed to start production server:', error);
  process.exit(1);
});
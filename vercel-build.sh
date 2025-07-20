#!/bin/bash
echo "Building for Vercel deployment..."

# Clean any existing build
rm -rf dist

# Build client only (no server needed for Vercel)
echo "Building client with Vite..."
npx vite build --config vite.config.production.ts

echo "Build completed!"
ls -la dist/public/
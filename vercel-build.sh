#!/bin/bash
set -e  # Exit on any error

echo "==== Starting Vercel Build Process ===="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Clean any existing build
echo "==== Step 1: Cleaning previous builds ===="
rm -rf dist
mkdir -p dist/public

# Build client with detailed logging
echo "==== Step 2: Building client with Vite ===="
echo "Running: npx vite build --config vite.config.production.ts"
npx vite build --config vite.config.production.ts

echo "==== Step 3: Verifying build output ===="
if [ -d "dist/public" ]; then
    echo "✓ Client build successful"
    ls -la dist/public/
    echo "Build files count: $(find dist/public -type f | wc -l)"
else
    echo "✗ Client build failed - dist/public directory not found"
    exit 1
fi

echo "==== Build Process Completed Successfully ===="
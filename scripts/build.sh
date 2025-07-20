#!/bin/bash

echo "Building client and server for Vercel deployment..."

# Build client with production config
echo "Building client..."
vite build --config vite.config.production.ts

# Build server with correct esbuild command (without extra spaces)
echo "Building server..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"
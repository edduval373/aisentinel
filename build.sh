#!/bin/bash

# Build script for Vercel deployment
echo "Building AI Sentinel for Vercel..."

# Install dependencies
npm install

# Build the client
echo "Building client..."
npm run build:client

# Build the server
echo "Building server..."
npm run build:server

echo "Build completed successfully!"
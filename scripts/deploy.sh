#!/bin/bash

echo "🚀 Starting deployment process..."

# Build and deploy backend to Render
echo "📦 Building backend..."
cd server
npm install --production
echo "✅ Backend dependencies installed"

# Build and deploy frontend to Netlify
echo "📦 Building frontend..."
cd ../client
npm install
npm run build
echo "✅ Frontend built successfully"

echo "🎉 Deployment preparation complete!"
echo "Next steps:"
echo "1. Push to GitHub"
echo "2. Deploy backend on Render"
echo "3. Deploy frontend on Netlify"

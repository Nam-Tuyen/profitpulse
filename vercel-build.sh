#!/bin/bash
# Vercel build script - Frontend only
echo "Building frontend only (no Python)"
cd frontend
npm ci --omit=dev
npm run build

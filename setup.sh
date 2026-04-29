#!/bin/bash

# Shop Manager Setup Script for Unix/Linux/Mac

echo "=========================================="
echo "Shop Manager - Setup Script"
echo "=========================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js is installed:"
node --version
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    echo "npm should be installed with Node.js."
    exit 1
fi

echo "[OK] npm is installed:"
npm --version
echo

# Install dependencies
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies."
    exit 1
fi

echo
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo
echo "To start the application:"
echo "  npm start              - Start the server"
echo "  npm run dev            - Start with auto-reload"
echo
echo "Application will be available at:"
echo "  http://localhost:3000"
echo
echo "To access the app:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Register a new account"
echo "  3. Log in with your credentials"
echo

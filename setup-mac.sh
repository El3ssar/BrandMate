#!/bin/bash
# Brand Guardian AI - macOS Setup Script

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Braid - macOS Setup                        ║"
echo "║                    Version 2.1.0                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not installed"
    echo "  Install via: brew install node"
    echo "  Or visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "✗ Node.js version too old (need 18+)"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Setup .env
if [ -f ".env" ]; then
    echo "⚠ .env file exists"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        SETUP_ENV=false
    else
        SETUP_ENV=true
    fi
else
    SETUP_ENV=true
fi

if [ "$SETUP_ENV" = true ]; then
    cp .env.example .env
    echo "✓ Created .env file"
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_ME_$(date +%s)")
    if command -v sed &> /dev/null; then
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
        echo "✓ Generated JWT secret"
    fi
    
    echo ""
    echo "📝 Please add your AI provider API key to .env file:"
    echo "   Gemini (recommended): https://makersuite.google.com/app/apikey"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Create data directory
mkdir -p data
echo "✓ Data directory ready"
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Setup Complete! 🎉                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit .env and add your API key:"
echo "     nano .env"
echo ""
echo "  2. Start development:"
echo "     npm run dev"
echo ""
echo "  3. Open browser:"
echo "     http://localhost:5173"
echo ""

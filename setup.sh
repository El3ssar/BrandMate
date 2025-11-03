#!/bin/bash

# Brand Guardian AI - Setup Script
# This script helps you set up the application for first-time use

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Braid - Setup Wizard                       ║"
echo "║                     Version 2.0                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js version
echo "→ Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed. Please install Node.js 18+ first."
    echo "  Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "✗ Node.js version $NODE_VERSION is too old. Please install Node.js 18+."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠ .env file already exists."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
        SETUP_ENV=false
    else
        SETUP_ENV=true
    fi
else
    SETUP_ENV=true
fi

# Setup .env file
if [ "$SETUP_ENV" = true ]; then
    echo ""
    echo "→ Setting up environment variables..."
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Configuration Required"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "You need at least ONE AI provider API key to use Brand Guardian."
    echo "Get your API keys from:"
    echo "  • Google Gemini: https://makersuite.google.com/app/apikey"
    echo "  • OpenAI:        https://platform.openai.com/api-keys"
    echo "  • xAI Grok:      https://console.x.ai/"
    echo ""
    
    # JWT Secret
    echo "Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_THIS_TO_SECURE_RANDOM_STRING_$(date +%s)")
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    echo "✓ Generated JWT secret"
    echo ""
    
    # Gemini API Key
    read -p "Do you have a Google Gemini API key? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Gemini API key: " GEMINI_KEY
        sed -i.bak "s|GOOGLE_API_KEY=.*|GOOGLE_API_KEY=$GEMINI_KEY|" .env
        echo "✓ Gemini API key configured"
    fi
    echo ""
    
    # OpenAI API Key
    read -p "Do you have an OpenAI API key? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenAI API key: " OPENAI_KEY
        sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" .env
        echo "✓ OpenAI API key configured"
    fi
    echo ""
    
    # Grok API Key
    read -p "Do you have a Grok (xAI) API key? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Grok API key: " GROK_KEY
        sed -i.bak "s|XAI_API_KEY=.*|XAI_API_KEY=$GROK_KEY|" .env
        echo "✓ Grok API key configured"
    fi
    echo ""
    
    # Clean up backup
    rm -f .env.bak
    
    echo "✓ Environment configuration complete!"
    echo ""
fi

# Install dependencies
echo "→ Installing dependencies..."
if npm install; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi
echo ""

# Create data directory
echo "→ Creating data directory..."
mkdir -p data
echo "✓ Data directory ready"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   Setup Complete! 🎉                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. Review/edit .env file if needed:"
echo "     nano .env"
echo ""
echo "  2. Start development server:"
echo "     npm run dev"
echo ""
echo "  3. Open your browser to:"
echo "     http://localhost:5173"
echo ""
echo "  4. For production deployment:"
echo "     npm run build"
echo "     npm start"
echo ""
echo "Documentation:"
echo "  • README.md - Full documentation"
echo "  • DEPLOYMENT.md - Deployment guide"
echo ""
echo "Have a great time building with Brand Guardian AI! 🚀"
echo ""



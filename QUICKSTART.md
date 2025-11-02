# Quick Start Guide

Get Brand Guardian AI up and running in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- One AI provider API key (Gemini recommended)

## 🚀 Fastest Setup (Linux/Mac)

```bash
# Run the setup script
./setup.sh

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

The setup script will:
- ✓ Check Node.js version
- ✓ Create .env configuration
- ✓ Prompt for API keys
- ✓ Install dependencies
- ✓ Set up database directory

## 📝 Manual Setup

If you prefer manual setup or the script doesn't work:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env
```

**Required variables:**
```env
# Generate a secure secret:
JWT_SECRET=your-secure-random-string-here

# Add at least one API key:
GOOGLE_API_KEY=your-gemini-api-key
# or
OPENAI_API_KEY=your-openai-key
# or
XAI_API_KEY=your-grok-key
```

**Get API Keys:**
- Gemini (Free tier available): https://makersuite.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys
- Grok: https://console.x.ai/

### 3. Start Development
```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:5173` (Vite dev server)
- Backend API on `http://localhost:3000`

### 4. Create Your Account
1. Open http://localhost:5173
2. Click "Create Account"
3. Fill in your details
4. Start creating brand sessions!

## 🎨 First Brand Session

Once logged in:

1. **Create Session**
   - Click "+ New Brand Session" in sidebar
   - Name it (e.g., "Nike Campaign 2025")
   - Choose AI provider (Gemini recommended to start)

2. **Configure Brand**
   - Add brand colors
   - Write/paste brand guidelines
   - Upload design system PDF (optional)
   - Upload 5 approved examples
   - Upload correct/incorrect product labels

3. **Distill Rules**
   - Click "Distill Visual Rules"
   - Wait for AI analysis (~30 seconds)

4. **Review Assets**
   - Switch to "Asset Review" tab
   - Upload campaign images to audit
   - Click "Review Assets"
   - Get compliance report!

## 🐳 Docker Quick Start

If you have Docker installed:

```bash
# Create .env file
cp .env.example .env
# Add your API keys to .env

# Start with Docker Compose
docker-compose up -d

# Open http://localhost:3000
```

## 🌐 Production Deployment

### Quick Deploy to Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more deployment options.

## 🆘 Troubleshooting

### Port 3000 already in use
```bash
# Change port in .env
PORT=3001
```

### API Key not working
- Check for typos in `.env`
- Ensure no quotes around the key
- Verify key is active in provider dashboard
- Restart server after changing `.env`

### Dependencies won't install
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Can't access after setup
- Verify both servers started (check terminal output)
- Try http://localhost:5173 (not 3000)
- Check firewall/antivirus isn't blocking ports
- Review terminal for error messages

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Review [CHANGELOG.md](CHANGELOG.md) for version history

## 💡 Tips

- **Gemini is fastest** for most use cases and has generous free tier
- **OpenAI GPT-4o** is most accurate but costs more
- **Auto-save works** - your changes save automatically
- **Export regularly** - backup your brand configurations
- **Use templates** - create a base session and duplicate it
- **Multiple sessions** - organize by client, campaign, or brand

## 🎯 Common Workflows

### Scenario: Agency with Multiple Clients

1. Create one session per client brand
2. Configure each brand's guidelines
3. Switch between sessions in sidebar
4. Review client assets in respective sessions
5. Export all sessions monthly for backup

### Scenario: Brand Team with Campaigns

1. Create master brand session
2. Duplicate for each campaign
3. Adjust seasonal/campaign-specific rules
4. Review campaign assets
5. Share compliant assets with team

### Scenario: Freelance Designer

1. Create session per project
2. Import client's brand guidelines
3. Review your work before presenting
4. Export session to share with client
5. Delete old projects to keep organized

## 🤝 Need Help?

- Check terminal output for errors
- Review browser console (F12)
- Verify all environment variables set
- Ensure database directory exists (`data/`)
- Check API provider status pages

Happy brand guarding! 🎨✨



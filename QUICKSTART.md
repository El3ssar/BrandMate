# Quick Start Guide - 5 Minutes to Running

## For macOS/Linux

```bash
./setup.sh
npm run dev
```

Open `http://localhost:5173` ✨

## For Windows

```batch
setup.bat
npm run dev
```

Open `http://localhost:5173` ✨

## Manual Setup (All Platforms)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add at least one API key:
```env
GOOGLE_API_KEY=your-gemini-key-here
```

Get free Gemini key: https://makersuite.google.com/app/apikey

### 3. Start Development
```bash
npm run dev
```

### 4. Create Account
- Open http://localhost:5173
- Click "Create Account"
- Fill in details
- Start creating brand sessions!

---

## First Brand Session

1. **Click "+ New Brand Session"**
   - Name: "My First Brand"
   - Provider: Google Gemini (recommended)

2. **Configure Brand**
   - Add 2-3 brand colors
   - Write or paste brand guidelines
   - Upload design system PDF (optional)
   - Upload 5 example images

3. **Generate Visual Rules**
   - Click "▶️ Distill Visual Rules"
   - Wait 30 seconds
   - See detailed brand analysis

4. **Review Assets**
   - Switch to "Asset Review" tab
   - Upload campaign images
   - Click "Start Review"
   - Get per-asset compliance report!

---

## Production Deployment

### Docker (Easiest)
```bash
docker-compose up -d
```

### Node.js
```bash
npm run build
npm start
```

### Cloud
```bash
# Railway
railway up

# Render
# Connect GitHub, auto-deploy

# Fly.io
fly deploy
```

---

## Troubleshooting

**Port in use**:
```bash
PORT=3001 npm run dev
```

**Dependencies fail**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Can't login**:
- Check .env has JWT_SECRET
- Restart server

**Distill not working**:
- Verify API key in .env
- Check provider (use Gemini)
- Restart server

---

## Support

- **README.md** - Full documentation
- **DEPLOYMENT.md** - Production guide
- **PITCH.md** - Business overview

**Ready in 5 minutes!** 🚀

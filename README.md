# Brand Guardian AI - Production Platform

**Version 2.0** - A production-ready platform for creative directors to manage and audit brand compliance using AI.

![Brand Guardian](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Overview

Brand Guardian AI is a comprehensive multimodal RAG (Retrieval-Augmented Generation) system that helps creative directors ensure brand compliance across marketing assets. It provides:

- **Multi-Brand Management**: Manage multiple brand guideline configurations in one place
- **AI-Powered Auditing**: Automatically review assets using Gemini, OpenAI, or Grok
- **Persistent Sessions**: Save and organize brand configurations by project
- **Export/Import**: Backup and share brand configurations easily
- **Detailed Reports**: Get comprehensive compliance reports with actionable feedback
- **User Authentication**: Secure multi-user support with JWT authentication

## ✨ Features

### For Creative Directors

- 🎨 **Visual Brand Guidelines**: Upload design systems, approved examples, and product labels
- 📝 **Text Guidelines**: Define typography, colors, tone of voice, and legal requirements
- 🔍 **Asset Review**: Upload campaign assets and get instant compliance audits
- 📊 **Detailed Reports**: Receive severity-ranked compliance findings with actionable feedback
- 💾 **Session Management**: Organize different brand projects in separate sessions
- 📤 **Export/Import**: Share configurations across teams or backup your work

### Technical Features

- ⚡ **Modern Stack**: React + TypeScript + Vite frontend, Express backend
- 🗄️ **SQLite Database**: Portable, zero-configuration database
- 🔐 **JWT Authentication**: Secure user sessions
- 🐳 **Docker Ready**: Easy deployment with Docker and Docker Compose
- 🤖 **Multi-Provider AI**: Support for Google Gemini, OpenAI, and xAI Grok
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- At least one AI provider API key (Gemini, OpenAI, or Grok)

### Local Development

1. **Clone and Install**

```bash
git clone <repository-url>
cd brand_guardian
npm install
```

2. **Configure Environment**

```bash
cp .env.example .env
# Edit .env and add your API keys
```

Required environment variables:

- `GOOGLE_API_KEY` - For Google Gemini (recommended)
- `OPENAI_API_KEY` - For OpenAI ChatGPT (optional)
- `XAI_API_KEY` - For Grok (optional)
- `JWT_SECRET` - Change to a secure random string for production

3. **Start Development Server**

```bash
npm run dev
```

This will start:

- Frontend dev server at `http://localhost:5173`
- Backend API server at `http://localhost:3000`

4. **Open Browser**
   Navigate to `http://localhost:5173` and create an account to get started!

### Production Deployment

#### Option 1: Docker (Recommended)

1. **Build and Run with Docker Compose**

```bash
# Create .env file with your configuration
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

The application will be available at `http://localhost:3000`

2. **Docker without Compose**

```bash
# Build image
docker build -t brand-guardian .

# Run container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e GOOGLE_API_KEY=your_key_here \
  -e JWT_SECRET=your_secret_here \
  --name brand-guardian \
  brand-guardian
```

#### Option 2: Node.js Direct

1. **Build Frontend**

```bash
npm run build
```

2. **Start Production Server**

```bash
NODE_ENV=production npm start
```

#### Option 3: Cloud Platforms

**Deploy to Railway.app**

```bash
railway login
railway init
railway up
```

**Deploy to Render.com**

- Connect your repository
- Set build command: `npm run build`
- Set start command: `npm start`
- Add environment variables in dashboard

**Deploy to Fly.io**

```bash
fly launch
fly deploy
```

## 📖 User Guide

### Getting Started

1. **Create Account**: Register with your email and create a password
2. **Create Brand Session**: Click "+ New Brand Session" in the sidebar
3. **Configure Brand**:
   - Add brand colors to the palette
   - Write or paste brand guidelines
   - Upload design system PDF
   - Upload approved brand examples
   - Add product label examples (correct and incorrect)
4. **Distill Visual Rules**: Click "Distill Visual Rules" to generate AI-analyzed brand patterns
5. **Review Assets**:
   - Switch to "Asset Review" tab
   - Upload images to audit
   - Click "Review Assets"
   - Review the compliance report

### Managing Sessions

- **Switch Sessions**: Click on any session in the sidebar to load it
- **Delete Session**: Click the ⋮ menu on a session card
- **Export Sessions**: Click "📤 Export All Sessions" to download a JSON backup
- **Import Sessions**: Click "📥 Import Sessions" to restore from a JSON file

### AI Providers

Choose between three AI providers for each brand session:

- **Google Gemini** (Recommended): Best value, fast, good multimodal support
- **OpenAI GPT-4o**: Most accurate, best for complex brand guidelines
- **Grok**: Alternative option with good visual understanding

## 🏗️ Architecture

```
brand_guardian/
├── src/                      # React frontend (TypeScript)
│   ├── components/
│   │   ├── auth/            # Login/Register
│   │   ├── brand/           # Brand configuration UI
│   │   ├── layout/          # Layout components
│   │   └── session/         # Session management
│   ├── services/            # API client
│   ├── store/               # React Context state
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── server/                   # Express backend
│   ├── db/                  # Database layer (SQLite)
│   ├── middleware/          # Auth middleware
│   ├── providers/           # AI provider integrations
│   ├── routes/              # API routes
│   └── server.js            # Main server file
├── public/                   # Legacy static files (archived)
└── data/                     # SQLite database (created on first run)
```

## 🔧 Configuration

### Environment Variables

| Variable         | Description                          | Required      | Default                 |
| ---------------- | ------------------------------------ | ------------- | ----------------------- |
| `PORT`           | Server port                          | No            | 3000                    |
| `NODE_ENV`       | Environment (development/production) | No            | development             |
| `DATABASE_PATH`  | SQLite database path                 | No            | ./data/brandguardian.db |
| `JWT_SECRET`     | Secret for JWT tokens                | **Yes**       | -                       |
| `JWT_EXPIRES_IN` | Token expiration                     | No            | 7d                      |
| `GOOGLE_API_KEY` | Google Gemini API key                | Conditional\* | -                       |
| `GEMINI_MODEL`   | Gemini model name                    | No            | gemini-1.5-flash        |
| `OPENAI_API_KEY` | OpenAI API key                       | Conditional\* | -                       |
| `OPENAI_MODEL`   | OpenAI model name                    | No            | gpt-4o                  |
| `XAI_API_KEY`    | xAI Grok API key                     | Conditional\* | -                       |
| `GROK_MODEL`     | Grok model name                      | No            | grok-2-vision-1212      |

\*At least one AI provider API key is required

### Getting API Keys

- **Google Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **xAI Grok**: https://console.x.ai/

## 🔒 Security Notes

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use HTTPS in production (reverse proxy with nginx/Caddy)
- [ ] Set strong passwords for user accounts
- [ ] Regularly backup the `data/` directory
- [ ] Keep API keys secure and never commit to git
- [ ] Set appropriate CORS origins if needed
- [ ] Review and limit file upload sizes

### Database Backups

```bash
# Backup database
cp data/brandguardian.db data/backup-$(date +%Y%m%d).db

# Restore from backup
cp data/backup-20250102.db data/brandguardian.db
```

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**

```bash
# Change port in .env
PORT=3001
```

**Database Locked**

```bash
# Stop all instances and restart
pkill node
npm start
```

**API Key Not Working**

- Verify the key is correct in `.env`
- Check provider dashboard for quota/billing
- Ensure environment variables are loaded (restart server)

**Build Errors**

```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

## 🛠️ Development

### Project Scripts

```bash
npm run dev          # Start development (frontend + backend)
npm run dev:client   # Start only frontend dev server
npm run dev:server   # Start only backend server
npm run build        # Build production frontend
npm run preview      # Preview production build
npm start            # Start production server
npm run db:reset     # Reset database (WARNING: deletes all data)
```

### Tech Stack

**Frontend**

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Context for state management

**Backend**

- Node.js + Express
- SQLite (better-sqlite3)
- JWT authentication
- bcryptjs for password hashing

**AI Integrations**

- Google Gemini API
- OpenAI API
- xAI Grok API

## 📄 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update profile (requires auth)

### Session Endpoints

- `GET /api/sessions` - List user's sessions
- `GET /api/sessions/:id` - Get specific session
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/export/all` - Export all sessions
- `POST /api/sessions/import` - Import sessions

### AI Endpoints

- `POST /api/destill` - Distill visual rules from images
- `POST /api/review` - Review assets against brand guidelines

## 🤝 Contributing

This is a production-ready platform. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built for creative directors who demand brand excellence.

**Version History**

- v2.0 - Production release with multi-user support, persistent sessions, modern UI
- v1.0 - Initial prototype with basic functionality

## 📞 Support

For issues and questions:

- GitHub Issues: [Create an issue]
- Documentation: This README
- Email: support@brandguardian.ai (if applicable)

---

**Made with ❤️ for Creative Directors**

# Deployment Guide - Brand Guardian AI

This guide covers various deployment scenarios for Brand Guardian AI in production environments.

## Table of Contents
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployments](#cloud-platform-deployments)
- [Traditional VPS Deployment](#traditional-vps-deployment)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Obtain at least one AI provider API key (Gemini/OpenAI/Grok)
- [ ] Generate a strong JWT secret: `openssl rand -base64 32`
- [ ] Plan database backup strategy
- [ ] Decide on domain name and SSL certificate approach
- [ ] Review security settings
- [ ] Test the application locally
- [ ] Prepare environment variables

## Docker Deployment

### Option 1: Docker Compose (Recommended)

**Prerequisites:**
- Docker Engine 20.10+
- Docker Compose 2.0+

**Steps:**

1. **Prepare Environment**
```bash
# Clone repository
git clone <your-repo>
cd brand_guardian

# Create environment file
cp .env.example .env

# Edit .env with production values
nano .env
```

Key production settings:
```env
NODE_ENV=production
JWT_SECRET=<your-secure-random-string>
GOOGLE_API_KEY=<your-gemini-key>
PORT=3000
```

2. **Build and Start**
```bash
# Build and start in detached mode
docker-compose up -d

# Check logs
docker-compose logs -f brand-guardian

# Verify it's running
curl http://localhost:3000/api/health
```

3. **Access Application**
Open browser to `http://your-server-ip:3000`

**Management Commands:**
```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update to new version
git pull
docker-compose down
docker-compose build
docker-compose up -d

# Backup database
docker exec brand-guardian cp /app/data/brandguardian.db /app/data/backup.db
docker cp brand-guardian:/app/data/backup.db ./backup-$(date +%Y%m%d).db
```

### Option 2: Docker CLI

```bash
# Build image
docker build -t brand-guardian:latest .

# Run container
docker run -d \
  --name brand-guardian \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e GOOGLE_API_KEY=your-key \
  --restart unless-stopped \
  brand-guardian:latest

# Check status
docker ps
docker logs brand-guardian
```

## Cloud Platform Deployments

### Railway.app

Railway offers easy deployment with automatic HTTPS.

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize Project**
```bash
cd brand_guardian
railway init
```

3. **Add Environment Variables**
```bash
railway variables set GOOGLE_API_KEY=your-key
railway variables set JWT_SECRET=your-secret
railway variables set NODE_ENV=production
```

4. **Deploy**
```bash
railway up
```

Railway will automatically:
- Build your application
- Set up a PostgreSQL database (optional, we use SQLite)
- Provide HTTPS domain
- Handle deployments

**Custom Domain:**
- Go to Railway dashboard
- Navigate to your project
- Click "Settings" → "Domains"
- Add your custom domain

### Render.com

1. **Create Account** at render.com

2. **Create New Web Service**
   - Connect your GitHub repository
   - Name: `brand-guardian`
   - Environment: `Docker`
   - Branch: `main`

3. **Configure Build**
   - Build Command: `docker build -t brand-guardian .`
   - Start Command: (auto-detected from Dockerfile)

4. **Add Environment Variables**
   - `GOOGLE_API_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`

5. **Deploy**
   - Render will automatically deploy on git push
   - Free tier includes HTTPS

### Fly.io

Fly.io offers global deployment with edge locations.

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

2. **Launch Application**
```bash
cd brand_guardian
fly launch
```

Follow prompts:
- App name: `brand-guardian-yourname`
- Region: Choose closest to your users
- Database: No (we use SQLite)

3. **Configure Secrets**
```bash
fly secrets set GOOGLE_API_KEY=your-key
fly secrets set JWT_SECRET=your-secret
fly secrets set NODE_ENV=production
```

4. **Deploy**
```bash
fly deploy
```

5. **Set Up Volume for Database Persistence**
```bash
fly volumes create brand_data --region ord --size 1

# Update fly.toml
[mounts]
  source = "brand_data"
  destination = "/app/data"

# Redeploy
fly deploy
```

### DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean dashboard
   - Click "Create" → "Apps"
   - Connect GitHub repository

2. **Configure**
   - Resource Type: Web Service
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: 3000

3. **Environment Variables**
   - Add all required variables from `.env.example`

4. **Deploy**
   - App Platform will build and deploy
   - Provides HTTPS automatically

## Traditional VPS Deployment

For VPS providers like DigitalOcean Droplets, Linode, AWS EC2, etc.

### Ubuntu/Debian Server

1. **Initial Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create app user
sudo useradd -m -s /bin/bash brandguardian
```

2. **Deploy Application**
```bash
# Switch to app user
sudo su - brandguardian

# Clone repository
git clone <your-repo> brand_guardian
cd brand_guardian

# Install dependencies
npm ci --production

# Build frontend
npm run build

# Create environment file
cp .env.example .env
nano .env  # Edit with production values
```

3. **Configure PM2**
```bash
# Start with PM2
pm2 start server/server.js --name brand-guardian

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it provides

# Monitor
pm2 monit
pm2 logs brand-guardian
```

4. **Configure Firewall**
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Nginx Reverse Proxy

1. **Install Nginx**
```bash
sudo apt install nginx -y
```

2. **Configure Site**
```bash
sudo nano /etc/nginx/sites-available/brandguardian
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/brandguardian /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Setup SSL with Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Caddy (Alternative Reverse Proxy)

Caddy provides automatic HTTPS with easier configuration.

1. **Install Caddy**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

2. **Configure Caddyfile**
```bash
sudo nano /etc/caddy/Caddyfile
```

Add:
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

3. **Restart Caddy**
```bash
sudo systemctl restart caddy
```

That's it! Caddy automatically handles SSL certificates.

## Monitoring & Maintenance

### Health Checks

The application provides a health endpoint:
```bash
curl http://localhost:3000/api/health
```

### Database Backups

**Automated Daily Backup Script:**
```bash
#!/bin/bash
# /home/brandguardian/backup.sh

BACKUP_DIR="/home/brandguardian/backups"
DB_PATH="/home/brandguardian/brand_guardian/data/brandguardian.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/backup_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.db" -mtime +30 -delete
```

Make executable and add to crontab:
```bash
chmod +x /home/brandguardian/backup.sh
crontab -e

# Add line for daily backup at 2 AM:
0 2 * * * /home/brandguardian/backup.sh
```

### Log Rotation

**For PM2:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoring with PM2

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs brand-guardian

# Restart if needed
pm2 restart brand-guardian

# View metrics
pm2 show brand-guardian
```

### Updates and Maintenance

**Update Application:**
```bash
# As brandguardian user
cd ~/brand_guardian
git pull
npm ci --production
npm run build
pm2 restart brand-guardian
```

**Zero-Downtime Updates with PM2:**
```bash
pm2 reload brand-guardian
```

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
pm2 logs brand-guardian --lines 100

# Check environment variables
pm2 env brand-guardian

# Verify database path exists
ls -la data/
```

**Database locked errors:**
```bash
# Stop all instances
pm2 delete all

# Clear any lock files
rm -f data/*.db-shm data/*.db-wal

# Restart
pm2 start server/server.js --name brand-guardian
```

**High memory usage:**
```bash
# Increase PM2 memory limit
pm2 start server/server.js --max-memory-restart 500M

# Monitor
pm2 monit
```

## Security Best Practices

1. **Never expose database port** - SQLite is file-based, ensure proper file permissions
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
3. **Enable firewall** - Only allow necessary ports (80, 443, 22)
4. **Regular updates** - Keep Node.js and dependencies updated
5. **HTTPS only** - Always use SSL in production
6. **Rate limiting** - Consider adding rate limiting middleware
7. **Backup regularly** - Automate database backups
8. **Monitor logs** - Set up log monitoring for errors

## Performance Optimization

### For High Traffic

1. **Use PM2 Cluster Mode**
```bash
pm2 start server/server.js -i max --name brand-guardian
```

2. **Enable Nginx Caching**
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=brand_cache:10m max_size=1g;

location /api/ {
    proxy_cache brand_cache;
    proxy_cache_valid 200 5m;
    # ... rest of proxy config
}
```

3. **Optimize SQLite**
- Use WAL mode (already enabled in code)
- Regular VACUUM operations
- Consider Read replicas for very high load

## Support

For deployment issues:
- Check application logs
- Verify environment variables
- Test database connectivity
- Review server resources (disk, memory, CPU)

---

**Good luck with your deployment! 🚀**



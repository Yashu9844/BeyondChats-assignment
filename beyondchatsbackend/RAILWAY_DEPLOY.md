# Railway Deployment Guide for BeyondChat Backend

## ✅ Pre-Deployment Checklist

Your Laravel backend is now configured for Railway deployment with these files:

| File | Purpose |
|------|---------|
| `Procfile` | Tells Railway how to start the app |
| `nixpacks.toml` | Configures PHP extensions and build steps |
| `railway.json` | Railway-specific deployment config |
| `.env.production` | Reference for production environment variables |

## 🚀 Deployment Steps

### Step 1: Push to GitHub
Make sure your `beyondchatsbackend` folder is pushed to a GitHub repository.

### Step 2: Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose the `beyondchatsbackend` folder if it's a monorepo

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically provide `DATABASE_URL`

### Step 4: Configure Environment Variables
In Railway's "Variables" tab, add these:

```env
APP_NAME=BeyondChat
APP_ENV=production
APP_KEY=base64:XU1dk3L+2ZUa6CPozwxaGlMqkLpBwvDPjBdpznuFJmg=
APP_DEBUG=false
APP_URL=https://your-app-name.up.railway.app

# Database - Railway provides these automatically when you link PostgreSQL
DB_CONNECTION=pgsql
# DATABASE_URL is auto-provided by Railway

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error

# CORS (update with your frontend URL)
SANCTUM_STATEFUL_DOMAINS=your-frontend.vercel.app,your-frontend.netlify.app
```

### Step 5: Deploy
Railway will automatically:
1. Detect PHP/Laravel
2. Run `composer install`
3. Run the start command from `Procfile`
4. Run migrations

## 🔧 Important Notes

### Database Migration
Migrations run automatically via the Procfile start command:
```
php artisan migrate --force
```

### Health Check
The app exposes `/up` endpoint for health checks (configured in `railway.json`).

### Trusted Proxies
Already configured in `bootstrap/app.php` to trust Railway's proxy for HTTPS detection.

### CORS for Frontend
Update `SANCTUM_STATEFUL_DOMAINS` with your actual frontend URL(s).

## 🐛 Troubleshooting

### Check Logs
In Railway dashboard, go to your service → "Logs" tab

### SSH into Container
Railway allows you to run commands via the "Shell" feature

### Database Connection Issues
Ensure PostgreSQL is linked and `DATABASE_URL` is available in variables

### Cache Issues
Run these commands via Railway shell:
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## 📁 Project Structure (Deployment Ready)

```
beyondchatsbackend/
├── .env.production      # Reference for Railway env vars
├── Procfile             # Railway start command
├── nixpacks.toml        # PHP extensions config
├── railway.json         # Railway deployment config
├── composer.json        # PHP dependencies
├── artisan              # Laravel CLI
├── public/              # Web root
│   └── index.php
├── app/                 # Application code
├── config/              # Laravel config
├── database/            # Migrations & seeders
├── routes/              # API & web routes
└── storage/             # Logs, cache, sessions
```

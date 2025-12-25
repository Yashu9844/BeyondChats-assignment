# BeyondChats Assignment - Full Stack Article Enhancement Platform

> 🔗 **Live Demo:** [https://beyond-chats-assignment-4v4q.vercel.app](https://beyond-chats-assignment-4v4q.vercel.app)

A monolithic repository containing Laravel backend, NodeJS worker, and React frontend for scraping, AI-enhancing, and displaying blog articles.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BeyondChats Platform                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   BeyondChats│     │    Laravel   │     │   NodeJS     │     │    React     │
│   Website    │────▶│   Backend    │◀────│   Worker     │     │   Frontend   │
│   (Source)   │     │   (Phase 1)  │     │  (Phase 2)   │     │  (Phase 3)   │
└──────────────┘     └──────┬───────┘     └──────────────┘     └──────┬───────┘
                           │                     │                    │
                           ▼                     ▼                    ▼
                    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                    │   SQLite/    │     │   Google     │     │   Displays   │
                    │   PostgreSQL │     │   Search +   │     │   Articles   │
                    │   Database   │     │   Groq LLM   │     │   with UI    │
                    └──────────────┘     └──────────────┘     └──────────────┘
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: Scraping & Storage
═══════════════════════════════════════════════════════════════════════════════
  BeyondChats.com/blogs
         │
         ▼
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │ 1. Find last    │────▶│ 2. Extract 5    │────▶│ 3. Store in     │
  │    page of      │     │    oldest       │     │    database     │
  │    pagination   │     │    articles     │     │                 │
  └─────────────────┘     └─────────────────┘     └─────────────────┘


PHASE 2: AI Enhancement
═══════════════════════════════════════════════════════════════════════════════
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │ 1. Fetch latest │────▶│ 2. Search title │────▶│ 3. Scrape top 2 │
  │    article from │     │    on Google    │     │    reference    │
  │    Laravel API  │     │    Custom Search│     │    articles     │
  └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                           │
         ┌─────────────────────────────────────────────────┘
         ▼
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │ 4. Send to LLM  │────▶│ 5. Append       │────▶│ 6. PUT updated  │
  │    (Groq/Gemini)│     │    references   │     │    article back │
  │    for rewriting│     │    at bottom    │     │    to Laravel   │
  └─────────────────┘     └─────────────────┘     └─────────────────┘


PHASE 3: Display
═══════════════════════════════════════════════════════════════════════════════
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │ React Frontend  │────▶│ GET /api/       │────▶│ Display with    │
  │ fetches from    │     │ articles        │     │ Original +      │
  │ Laravel API     │     │                 │     │ Enhanced views  │
  └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🔗 Live Links

| Component | URL |
|-----------|-----|
| **Frontend (Vercel)** | [https://beyond-chats-assignment-4v4q.vercel.app](https://beyond-chats-assignment-4v4q.vercel.app) |
| **Backend API (Local)** | `http://beyondchatsbackend.test/api` |

> 💡 The frontend includes a **Demo Mode** with sample articles when the backend is offline.

## 📁 Project Structure

```
BeyondChats/
├── README.md                    # This file (main documentation)
├── beyondchatsbackend/          # Phase 1: Laravel Backend
│   ├── app/
│   │   ├── Http/Controllers/    # CRUD API controllers
│   │   ├── Models/              # Article model
│   │   └── Services/            # Scraper service
│   ├── routes/api.php           # API routes
│   ├── database/migrations/     # Database schema
│   └── README.md                # Backend-specific docs
├── workernode/                  # Phase 2: NodeJS Worker
│   ├── index.js                 # Main worker script
│   ├── package.json
│   └── README.md                # Worker-specific docs
└── frontend/                    # Phase 3: React Frontend
    ├── src/
    │   ├── pages/               # Home & ArticleDetail
    │   └── services/            # API client
    ├── package.json
    └── README.md                # Frontend-specific docs
```

## 🚀 Quick Start (Local Setup)

### Prerequisites

- PHP 8.3+
- Composer
- Node.js 18+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/Yashu9844/BeyondChats-assignment.git
cd BeyondChats-assignment
```

### 2. Setup Laravel Backend (Phase 1)

```bash
cd beyondchatsbackend

# Install PHP dependencies
composer install

# Create database
touch database/database.sqlite

# Run migrations
php artisan migrate

# Start server
php artisan serve
```

Backend will be available at: **http://localhost:8000**

#### Scrape Articles

```bash
# Trigger scraper via API
curl -X POST http://localhost:8000/api/scrape

# Or run artisan command
php artisan scrape:beyondchats
```

### 3. Setup NodeJS Worker (Phase 2)

```bash
cd workernode

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys:
# - LARAVEL_BASE_URL=http://localhost:8000
# - GOOGLE_API_KEY=your_key
# - GOOGLE_CSX_ENGINE_ID=your_engine_id
# - GROQ_API_KEY=your_groq_key

# Run worker (enhances latest article)
node index.js
```

### 4. Setup React Frontend (Phase 3)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_LARAVEL_API_URL=http://localhost:8000/api" > .env.local

# Start dev server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List all articles |
| GET | `/api/articles/{id}` | Get single article |
| POST | `/api/articles` | Create new article |
| PUT | `/api/articles/{id}` | Update article |
| DELETE | `/api/articles/{id}` | Delete article |
| POST | `/api/scrape` | Trigger article scraper |
| POST | `/api/enhance/{id}` | Trigger AI enhancement |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Laravel 12, PHP 8.3, SQLite/PostgreSQL |
| **Worker** | Node.js 18+, Axios, Cheerio |
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, Framer Motion |
| **LLM** | Groq (llama-3.3-70b), Google Gemini (fallback) |
| **Search** | Google Custom Search API |
| **Deployment** | Vercel (frontend), Railway-ready (backend) |

## ✨ Features

- **🤖 AI-Enhanced Articles** - LLM rewrites articles with additional context
- **🔗 Reference Citations** - Scraped references appended to enhanced articles
- **🎨 Premium UI** - Awwwards/Dribbble-style glass morphism design
- **📱 Fully Responsive** - Works beautifully on all devices
- **🌙 Dark Theme** - Modern black/white theme with subtle gradients
- **💾 Demo Mode** - Frontend works offline with sample articles

## 🔑 Environment Variables

### Laravel Backend (.env)
```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:xxxxx
DB_CONNECTION=pgsql
DATABASE_URL=provided_by_railway
```

### NodeJS Worker (.env)
```env
LARAVEL_BASE_URL=http://beyondchatsbackend.test
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSX_ENGINE_ID=your_search_engine_id
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEYS=key1,key2 (optional fallback)
```

### React Frontend (.env.local)
```env
VITE_LARAVEL_API_URL=http://beyondchatsbackend.test/api
```

> 💡 If the backend is unreachable, the frontend automatically switches to **Demo Mode** with sample articles.

## 📸 Screenshots

### Home Page - Article Listing
> Shows both original and AI-enhanced articles in a clean card layout

### Article Detail - Enhanced View
> Displays rewritten content with collapsible original text and clickable references

## ✅ Assignment Checklist

| Requirement | Status |
|-------------|--------|
| **Phase 1: Laravel Scraper** | |
| Scrape 5 oldest articles from last page | ✅ |
| Store in database | ✅ |
| CRUD APIs | ✅ |
| **Phase 2: NodeJS Worker** | |
| Fetch latest article | ✅ |
| Search on Google | ✅ |
| Scrape 2 reference articles | ✅ |
| Call LLM to rewrite | ✅ |
| Publish updated article | ✅ |
| Cite references at bottom | ✅ |
| **Phase 3: React Frontend** | |
| React frontend | ✅ |
| Fetch from Laravel API | ✅ |
| Responsive professional UI | ✅ |
| Show original + updated articles | ✅ |
| Premium Awwwards-style design | ✅ |
| Demo mode fallback | ✅ |
| **Submission** | |
| Monolithic git repo | ✅ |
| README with setup docs | ✅ |
| Architecture diagram | ✅ |
| Live frontend link | ✅ [Deployed](https://beyond-chats-assignment-4v4q.vercel.app) |

## 👤 Author

**Yashwanth**
- GitHub: [@Yashu9844](https://github.com/Yashu9844)

## 📄 License

This project is created for the BeyondChats assignment evaluation.

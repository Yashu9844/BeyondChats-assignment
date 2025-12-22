# Quick Start Guide

## 🚀 Getting Started

### 1. Run the Scraper
```bash
php artisan scrape:beyondchats
```

Expected output:
```
Starting BeyondChats blog scraper...
Fetching articles from BeyondChats...
Found 5 articles. Processing...
Saved: 'Article 1'
Saved: 'Article 2'
...
✓ Scraping completed!
New articles: 5
Skipped (duplicates): 0
```

### 2. Start the API Server
```bash
php artisan serve
```

The API will be available at: `http://localhost:8000`

### 3. Test the APIs

**List all articles:**
```bash
curl http://localhost:8000/api/articles
```

**Get single article:**
```bash
curl http://localhost:8000/api/articles/1
```

**Create article:**
```bash
curl -X POST http://localhost:8000/api/articles \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"title\":\"My Article\",\"content\":\"Article content here\"}"
```

**Update article:**
```bash
curl -X PUT http://localhost:8000/api/articles/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"title\":\"Updated Title\"}"
```

**Delete article:**
```bash
curl -X DELETE http://localhost:8000/api/articles/1 \
  -H "Accept: application/json"
```

## 📊 Check Database

View all articles:
```bash
php artisan tinker --execute="echo json_encode(App\Models\Article::all()->toArray(), JSON_PRETTY_PRINT);"
```

Count articles:
```bash
php artisan tinker --execute="echo App\Models\Article::count();"
```

## 🧪 Run Tests

Automated API test script:
```bash
php test_apis.php
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `php artisan serve` | Start dev server |
| `php artisan scrape:beyondchats` | Run scraper |
| `php artisan migrate` | Run migrations |
| `php artisan route:list` | List all routes |
| `php artisan tinker` | Interactive console |

## ✅ Phase 1 Complete!

All 6 phases implemented:
- ✅ Phase 1.1: Database Setup
- ✅ Phase 1.2: Source Analysis
- ✅ Phase 1.3: Scraper Implementation
- ✅ Phase 1.4: Data Storage
- ✅ Phase 1.5: CRUD APIs
- ✅ Phase 1.6: Documentation

For detailed information, see README.md

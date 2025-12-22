# BeyondChats Backend - Phase 1

A Laravel-based backend application for scraping and managing blog articles from BeyondChats.

## 📋 Project Overview

This project implements **Phase-1** of the BeyondChats assignment, which includes:

1. Scraping the **5 oldest articles** from the **last page** of BeyondChats blogs
2. Storing them in a database
3. Exposing RESTful CRUD APIs for article management

**Scope**: Laravel backend only. No frontend, no deployment, no authentication.

## 🛠️ Tech Stack

- **Framework**: Laravel 11.x
- **Language**: PHP 8.3+
- **Database**: SQLite
- **HTTP Client**: Laravel HTTP Client (Guzzle)
- **Web Scraping**: Native PHP (regex-based HTML parsing)

## 📦 Installation & Setup

### Prerequisites

- PHP 8.3 or higher
- Composer
- Laravel Herd (recommended) or any PHP development environment

### Local Setup Steps

1. **Clone/Navigate to the project**
   ```bash
   cd C:\Users\yashwanth\Desktop\BeyondChat\beyondchatsbackend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Environment configuration**
   
   The `.env` file should already be configured with SQLite:
   ```
   DB_CONNECTION=sqlite
   DB_DATABASE=C:\Users\yashwanth\Desktop\BeyondChat\beyondchatsbackend\database\database.sqlite
   ```

4. **Run migrations**
   ```bash
   php artisan migrate
   ```

5. **Start the development server**
   ```bash
   php artisan serve
   ```
   
   The API will be available at: `http://localhost:8000`

## 🕷️ Scraper Usage

### Run the scraper

```bash
php artisan scrape:beyondchats
```

### What the scraper does

1. Fetches the blog listing from `https://beyondchats.com/blogs/`
2. Identifies the **last page** of pagination
3. Extracts article URLs from that page
4. Selects the **5 oldest articles** (last 5 on the page)
5. For each article:
   - Fetches the full article page
   - Extracts: title, content, published date, URL
   - Generates a unique slug
6. Stores articles in the database (skips duplicates)

### Sample output

```
Starting BeyondChats blog scraper...
Fetching articles from BeyondChats...
Found 5 articles. Processing...
Saved: 'Choosing the right AI chatbot'
Saved: 'Google Ads: Are you wasting your money on clicks?'
Saved: 'Should you trust AI in healthcare?'
Saved: 'Why we are building yet another AI Chatbot'
Saved: 'What is Conversational AI?'

✓ Scraping completed!
New articles: 5
Skipped (duplicates): 0
```

### Safe re-runs

The scraper can be run multiple times safely. It checks for existing articles by:
- `source_url` (original URL)
- `slug` (generated from title)

Duplicates are automatically skipped.

## 🔌 API Endpoints

All endpoints return JSON responses. No authentication required.

### Base URL
```
http://localhost:8000/api
```

### Available Endpoints

#### 1. List all articles
```http
GET /api/articles
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Choosing the right AI chatbot",
      "slug": "choosing-the-right-ai-chatbot",
      "content": "...",
      "source_url": "https://beyondchats.com/blogs/...",
      "published_at": "2024-01-15T10:30:00.000000Z",
      "created_at": "2025-12-22T20:55:00.000000Z",
      "updated_at": "2025-12-22T20:55:00.000000Z"
    }
  ]
}
```

#### 2. Get a single article
```http
GET /api/articles/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Choosing the right AI chatbot",
    "slug": "choosing-the-right-ai-chatbot",
    "content": "...",
    "source_url": "https://beyondchats.com/blogs/...",
    "published_at": "2024-01-15T10:30:00.000000Z",
    "created_at": "2025-12-22T20:55:00.000000Z",
    "updated_at": "2025-12-22T20:55:00.000000Z"
  }
}
```

**404 Response:**
```json
{
  "success": false,
  "message": "Article not found"
}
```

#### 3. Create a new article
```http
POST /api/articles
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Article Title",
  "content": "Article content goes here...",
  "slug": "new-article-title",  // Optional - auto-generated from title if not provided
  "source_url": "https://example.com/article",  // Optional
  "published_at": "2024-12-22T10:00:00Z"  // Optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "id": 6,
    "title": "New Article Title",
    "slug": "new-article-title",
    "content": "Article content goes here...",
    "source_url": "https://example.com/article",
    "published_at": "2024-12-22T10:00:00.000000Z",
    "created_at": "2025-12-22T21:00:00.000000Z",
    "updated_at": "2025-12-22T21:00:00.000000Z"
  }
}
```

#### 4. Update an article
```http
PUT /api/articles/{id}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated Article Title",
  "content": "Updated content...",
  "slug": "updated-article-title",
  "source_url": "https://example.com/updated",
  "published_at": "2024-12-22T11:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Article updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Article Title",
    "slug": "updated-article-title",
    "content": "Updated content...",
    "source_url": "https://example.com/updated",
    "published_at": "2024-12-22T11:00:00.000000Z",
    "created_at": "2025-12-22T20:55:00.000000Z",
    "updated_at": "2025-12-22T21:05:00.000000Z"
  }
}
```

#### 5. Delete an article
```http
DELETE /api/articles/{id}
```

**Response:**
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

## 🏗️ Architecture

### Clean Separation of Concerns

```
User Request
    ↓
Artisan Command (scrape:beyondchats)
    ↓
ArticleScraperService (scraping logic)
    ↓
Article Model
    ↓
SQLite Database
    ↓
ArticleController (CRUD APIs)
    ↓
JSON Response
```

### Component Breakdown

#### 1. **ArticleScraperService** (`app/Services/ArticleScraperService.php`)
- **Responsibility**: All scraping logic
- **Methods**:
  - `scrapeOldestArticles()` - Main entry point
  - `getLastPageNumber()` - Finds pagination end
  - `getArticleUrlsFromPage()` - Extracts URLs from a page
  - `scrapeArticleContent()` - Fetches full article data
  - `extractTitle()`, `extractContent()`, `extractPublishedDate()` - HTML parsing

**Why this approach?**
- Keeps scraping logic separate from command/controller
- Easy to test and modify
- Can be reused elsewhere if needed

#### 2. **ScrapeBeyondChatsBlogs Command** (`app/Console/Commands/ScrapeBeyondChatsBlogs.php`)
- **Responsibility**: CLI interface + data storage orchestration
- **Signature**: `scrape:beyondchats`
- **Logic**:
  - Calls scraper service
  - Handles duplicate checking
  - Stores articles in database
  - Provides user feedback

**Why separate from service?**
- Service returns data, doesn't touch database
- Command handles storage decisions (insert/skip)
- Clean testing boundary

#### 3. **Article Model** (`app/Models/Article.php`)
- **Fillable**: `title`, `slug`, `content`, `source_url`, `published_at`
- **Casts**: `published_at` → datetime
- Standard Eloquent model for database interaction

#### 4. **ArticleController** (`app/Http/Controllers/ArticleController.php`)
- **Responsibility**: REST API endpoints
- **Methods**: `index`, `show`, `store`, `update`, `destroy`
- **Validation**: Basic validation on create/update
- **Auto-slug**: Generates slug from title if not provided

#### 5. **Routes** (`routes/api.php`)
- 5 RESTful routes under `/api/articles`
- No authentication middleware
- Clean, predictable URL structure

### Database Schema

**Table**: `articles`

| Column        | Type      | Constraints       |
|---------------|-----------|-------------------|
| id            | bigint    | primary, auto     |
| title         | string    | required          |
| slug          | string    | unique            |
| content       | longText  | required          |
| source_url    | string    | nullable          |
| published_at  | timestamp | nullable          |
| created_at    | timestamp | auto              |
| updated_at    | timestamp | auto              |

## 🔍 Scraping Approach & Assumptions

### Decision: HTML Scraping (No Browser Automation)

After analyzing `https://beyondchats.com/blogs/`:

1. **Blog listing page** contains visible article links in HTML
2. **Pagination** is implemented with standard URL structure (`/page/N`)
3. **Individual articles** are accessible via direct HTTP requests
4. **No JavaScript rendering** required to access content

**Conclusion**: Use Laravel HTTP Client + regex-based HTML parsing.

**Why not browser automation (Selenium/Puppeteer)?**
- Unnecessary complexity
- Slower execution
- Additional dependencies
- The website doesn't require JavaScript for content

### Assumptions Made

1. **Pagination structure** remains consistent (`/blogs/page/N`)
2. **HTML structure** for articles is relatively stable
3. **"5 oldest articles"** means the last 5 articles on the last page (chronological order)
4. **Duplicate detection** via `source_url` or `slug` is sufficient
5. **No rate limiting** needed for this volume of requests
6. **Published date** may not always be available in HTML

### Limitations

- Regex-based parsing is fragile to HTML structure changes
- No retry logic for failed HTTP requests
- No rate limiting implemented
- Assumes small-scale usage (not thousands of articles)

## 🧪 Testing

### Manual Testing

1. **Test the scraper:**
   ```bash
   php artisan scrape:beyondchats
   ```

2. **Test APIs with curl:**

   ```bash
   # List articles
   curl http://localhost:8000/api/articles
   
   # Get single article
   curl http://localhost:8000/api/articles/1
   
   # Create article
   curl -X POST http://localhost:8000/api/articles \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Article","content":"Test content"}'
   
   # Update article
   curl -X PUT http://localhost:8000/api/articles/1 \
     -H "Content-Type: application/json" \
     -d '{"title":"Updated Title"}'
   
   # Delete article
   curl -X DELETE http://localhost:8000/api/articles/1
   ```

3. **Or use Postman/Insomnia** for API testing with a GUI

## 📝 Notes

### What's NOT included (as per requirements)

- ❌ Authentication/Authorization
- ❌ Pagination on API responses
- ❌ Frontend/UI
- ❌ Deployment configuration
- ❌ Docker setup
- ❌ CI/CD pipelines
- ❌ Rate limiting
- ❌ Caching
- ❌ Background job processing
- ❌ API documentation (Swagger/OpenAPI)

### Future Improvements (Phase 2+)

- Implement proper HTML parsing (DOMDocument/Symfony DomCrawler)
- Add retry logic with exponential backoff
- Queue-based scraping for scalability
- API pagination
- Comprehensive test suite (PHPUnit)
- API documentation
- Error logging and monitoring

## 🎯 Assignment Completion Checklist

- ✅ **Phase 1.1**: Database setup with SQLite + Article model + migrations
- ✅ **Phase 1.2**: Source analysis (HTML scraping approach documented)
- ✅ **Phase 1.3**: Scraper implementation (Service + Command)
- ✅ **Phase 1.4**: Data storage with duplicate prevention
- ✅ **Phase 1.5**: CRUD APIs (5 endpoints)
- ✅ **Phase 1.6**: README documentation

---

**Developed with Laravel 11.x | PHP 8.3+ | SQLite**

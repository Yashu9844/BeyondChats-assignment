# BeyondChats Phase 2 - NodeJS Worker

A script-based worker that enriches blog articles by:
1. Fetching latest article from Laravel API
2. Finding reference articles via Google Search
3. Using LLM (Gemini) to rewrite and improve the article
4. Publishing updated content back to Laravel

## Refactoring Changes (Latest Version)

### Change 1: LLM-Driven Reference Discovery
**Priority order:**
1. **PRIMARY**: LLM suggests 2 reference URLs with content summaries
2. **VALIDATION**: Validates JSON structure, URLs, and content quality
3. **SCRAPING**: Attempts to scrape suggested URLs for full content
4. **FALLBACK 1**: If scraping fails, uses LLM summaries directly
5. **FALLBACK 2**: If LLM fails entirely, uses curated URL list

**Benefits:**
- Dynamic, context-aware reference discovery
- No dependency on Google SERP scraping
- Always finds relevant, high-quality sources
- Graceful degradation to curated URLs

### Change 2: API Key Load Balancing
**Implementation:**
- Multiple API keys in `.env` as comma-separated list
- Round-robin selection for each LLM call
- Distributes quota usage across keys
- Simple in-memory rotation (not retry logic)

**Configuration:**
```env
LLM_API_KEYS=key1,key2,key3
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env` file (already created):
```env
LARAVEL_BASE_URL=http://localhost:8000
LLM_API_KEY=YOUR_GOOGLE_GEMINI_KEY
```

### 3. Ensure Laravel backend is running
```bash
# In beyondchatsbackend directory
php artisan serve
```

## Usage

Run the worker:
```bash
node index.js
```

The worker will:
- ✅ Fetch the latest article from Laravel
- ✅ Search Google for related articles
- ✅ Scrape 2 external reference articles
- ✅ Call Gemini LLM to rewrite the article
- ✅ Append References section
- ✅ Update the article in Laravel via PUT API

## Phase 2 Steps Breakdown (REFACTORED)

### Phase 2.1 - Data Collection
- **Step 3**: Fetch latest article from Laravel API (`GET /api/articles`)
- **Step 4**: **LLM-driven reference discovery** (PRIMARY PATH)
  - LLM suggests 2 high-quality reference URLs + content summaries
  - Validates JSON structure and URL quality
  - Falls back to curated URLs if LLM fails
- **Step 5**: Scrape content from discovered URLs
  - If scraping fails, uses LLM-provided summaries directly
- **Step 6**: Prepare `originalArticle` and `referenceArticles` objects

### Phase 2.2 - LLM Processing & Publishing
- **Step 7-8**: Call Gemini LLM to rewrite article with improved formatting
- **Step 9**: Append References section with source URLs
- **Step 10**: Publish updated content to Laravel (`PUT /api/articles/{id}`)

## Data Flow

```
Laravel API (latest article)
    ↓
Google Search (article title)
    ↓
Top 2 external articles
    ↓
Scrape their content
    ↓
LLM rewrites original article
    ↓
Citations/References added
    ↓
Updated article published to Laravel
```

## Assumptions

1. **Latest Article Selection**
   - Laravel returns articles sorted by `created_at DESC`
   - Worker takes the first article as "latest"

2. **Google Search**
   - Uses HTML scraping of Google search results
   - Extracts URLs from `/url?q=...` pattern
   - Filters out Google domains and BeyondChats

3. **External Article Filtering**
   - Must be HTTP/HTTPS
   - Path depth >= 2 (not homepages)
   - Not from google.* or beyondchats.com

4. **Content Scraping**
   - Looks for `<article>`, `<main>`, or common content containers
   - Extracts `<p>` tags, filtering nav/footer/header
   - Minimum 50 characters per paragraph

5. **LLM Behavior**
   - Gemini 1.5 Flash model
   - Instructed to improve formatting/clarity
   - Must preserve original meaning
   - No plagiarism from references
   - References section added by worker (not LLM)

## Technologies

- **axios**: HTTP requests (Laravel API, Google Search, article scraping)
- **cheerio**: HTML parsing and content extraction
- **dotenv**: Environment variable management
- **Google Gemini API**: LLM for article rewriting

## Error Handling

The worker includes error handling for:
- Missing Laravel articles
- Failed Google searches
- Timeout/failed article scrapes
- LLM API errors
- Laravel API update failures

All errors are logged with details for debugging.

## Notes

- This is a **script-based worker**, not a server
- Run manually when you want to enrich an article
- No authentication required (as per assignment)
- Simple, readable code - easy to explain line-by-line

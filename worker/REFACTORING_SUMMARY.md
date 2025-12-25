# Phase 2 Worker Refactoring Summary

## Overview
The NodeJS worker has been refactored to implement two key improvements without changing the overall architecture or adding unnecessary complexity.

---

## Change 1: LLM-Driven Reference Discovery

### Previous Approach
- **Primary**: Google SERP scraping (unreliable, often blocked)
- **Fallback**: Hard-coded reference URLs

### New Approach (Priority Order)

#### 1. PRIMARY PATH: LLM-Driven Discovery
```
User provides: Article title
       ↓
LLM Research Assistant
       ↓
Returns JSON with 2 references:
{
  "references": [
    { "url": "...", "content": "summary..." },
    { "url": "...", "content": "summary..." }
  ]
}
```

**LLM Prompt (EXACT):**
```
You are a research assistant.

Given the following blog article title:
"<ARTICLE TITLE>"

1. Identify TWO high-quality external blog or article URLs
   from reputable websites (not BeyondChats).
2. These articles should cover similar topics.
3. For each article:
   - Provide the URL
   - Provide a detailed summary of the main content

Return ONLY valid JSON in this structure:
{
  "references": [
    { "url": "", "content": "" },
    { "url": "", "content": "" }
  ]
}

Do not include explanations outside the JSON.
Do not invent URLs. Prefer well-known publishers.
```

#### 2. VALIDATION
- Ensures valid JSON structure
- Validates exactly 2 references
- Checks URLs start with http/https
- Verifies content length (>100 chars)

#### 3. SCRAPING ATTEMPT
- Tries to fetch full content from suggested URLs
- Extracts main article body
- Validates scraped content quality

#### 4. FALLBACK LEVEL 1
**If scraping fails** but LLM response was valid:
- Uses LLM-provided content summaries directly
- These are already detailed and relevant

#### 5. FALLBACK LEVEL 2
**If LLM fails entirely**:
- Falls back to curated URL list
- Same as previous behavior
- Logs clearly that fallback is used

### Benefits
✅ **Dynamic**: Adapts to any article topic
✅ **Reliable**: No dependency on Google SERP scraping
✅ **High Quality**: LLM suggests reputable sources
✅ **Graceful Degradation**: Multiple fallback layers
✅ **Faster**: One LLM call vs multiple HTTP requests to Google

### Code Location
- **Function**: `discoverReferencesWithLLM()` in `index.js`
- **Refactored Function**: `collectReferenceArticles()` in `index.js`

---

## Change 2: API Key Load Balancing

### Previous Approach
- Single API key: `LLM_API_KEY`
- Hit quota limits quickly

### New Approach

#### Configuration
**`.env` format:**
```env
LLM_API_KEYS=key1,key2,key3
```

Comma-separated list of API keys.

#### Implementation
```javascript
// Parse keys
const LLM_API_KEYS = process.env.LLM_API_KEYS
  .split(',')
  .map(k => k.trim())
  .filter(k => k);

// Round-robin index
let currentKeyIndex = 0;

// Get next key
function getNextApiKey() {
  const key = LLM_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % LLM_API_KEYS.length;
  return key;
}
```

#### Behavior
1. Worker loads all keys at startup
2. Each LLM call rotates to next key
3. Distribution happens automatically
4. No retry logic (just distribution)

**Example with 3 keys:**
```
LLM Call 1 → Key 1
LLM Call 2 → Key 2
LLM Call 3 → Key 3
LLM Call 4 → Key 1 (wraps around)
```

### Benefits
✅ **Quota Distribution**: Spreads usage across multiple keys
✅ **Higher Throughput**: Can make more requests per minute
✅ **Simple**: No complex retry or backoff logic
✅ **Transparent**: Logs which key is used for each call

### Code Location
- **Configuration**: Lines 16-40 in `index.js`
- **Usage**: `getNextApiKey()` called in:
  - `discoverReferencesWithLLM()` (reference discovery)
  - `rewriteWithLLM()` (article rewriting)

---

## Unchanged Architecture

### What Did NOT Change
- ✅ Laravel API integration
- ✅ Article scraping logic
- ✅ LLM rewriting flow
- ✅ Publishing back to Laravel
- ✅ Overall step sequence (Steps 3-10)
- ✅ No new dependencies

### File Structure
```
worker/
├── index.js              ← REFACTORED
├── index.js.backup       ← Original version (backup)
├── .env                  ← UPDATED (multi-key format)
├── package.json          ← Unchanged
├── README.md             ← UPDATED (documentation)
└── REFACTORING_SUMMARY.md ← This file
```

---

## Testing

### Test Refactored Worker
```bash
cd C:\Users\yashwanth\Desktop\BeyondChat\worker
node index.js
```

### Expected Output
```
✓ Loaded 3 LLM API key(s)
╔════════════════════════════════════════════╗
║  BeyondChats Phase 2 Worker (REFACTORED)  ║
╚════════════════════════════════════════════╝

📥 Step 3: Fetching latest article from Laravel API...
   ✓ Found article ID: 1
   ✓ Title: Small Business - Beyondchats

📚 Step 5-6: Collecting reference articles...

🔍 Step 4: Using LLM to discover reference articles...
   Article: "Small Business - Beyondchats"
   🔑 Using API key #1
   ✓ LLM response received
   ✓ Validated 2 reference URLs from LLM
      1. https://www.sba.gov/...
      2. https://www.inc.com/...
   ✓ Using LLM-discovered references
   📄 Scraping: https://www.sba.gov/...
      ✓ Extracted 15 paragraphs
      ✓ Added reference article
   ...
   ✓ Collected 2 reference article(s)

🤖 Step 7-8: Calling LLM (Gemini) to rewrite article...
   🔑 Using API key #2
   ✓ Article rewritten by LLM

📎 Step 9: Appending References section...

📤 Step 10: Publishing updated article to Laravel...
   ✓ Article updated successfully in Laravel

╔════════════════════════════════════════════╗
║  ✓ Phase 2 Completed Successfully!        ║
╚════════════════════════════════════════════╝
```

### Key Indicators of Success
- ✅ Logs show "Using API key #1", "Using API key #2", etc.
- ✅ Logs show "LLM-discovered references" (not fallback)
- ✅ 2 valid references collected and scraped
- ✅ Article rewritten and published

---

## Rollback Instructions

If issues occur, restore the original:
```bash
cd C:\Users\yashwanth\Desktop\BeyondChat\worker
Copy-Item index.js.backup index.js -Force
```

Update `.env` back to single key:
```env
LLM_API_KEY=AIzaSyB1_ubRw1_ecXwO_R_wNw9kCMYLlvxpWTY
```

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Reference Discovery** | Google SERP scraping | LLM-driven discovery |
| **Reliability** | Often blocked | Highly reliable |
| **API Key Usage** | Single key | Round-robin across multiple keys |
| **Quota Management** | Manual | Automatic distribution |
| **Fallback Strategy** | Hard-coded URLs | LLM summaries → Curated URLs |
| **Complexity** | Moderate | Same (no added complexity) |

**Result**: More reliable, more intelligent, better quota management, same simplicity.

/**
 * BeyondChats Phase 2 - NodeJS Worker
 * 
 * This script-based worker:
 * 1. Fetches latest article from Laravel API
 * 2. Uses Google Custom Search API to find reference articles
 * 3. Scrapes content from reference URLs
 * 4. Uses LLM to rewrite the original article
 * 5. Publishes updated article back to Laravel
 * 
 * Run: node index.js
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

// ========== CONFIGURATION ==========

const LARAVEL_BASE_URL = process.env.LARAVEL_BASE_URL;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSX_ENGINE_ID = process.env.GOOGLE_CSX_ENGINE_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEYS_RAW = process.env.GEMINI_API_KEYS;

// Validate required environment variables
if (!LARAVEL_BASE_URL) {
  console.error('❌ Error: LARAVEL_BASE_URL not set in .env');
  process.exit(1);
}

if (!GOOGLE_API_KEY || !GOOGLE_CSX_ENGINE_ID) {
  console.error('❌ Error: GOOGLE_API_KEY or GOOGLE_CSX_ENGINE_ID not set in .env');
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.error('❌ Error: GROQ_API_KEY not set in .env');
  process.exit(1);
}

// Parse Gemini API keys for fallback (optional)
const GEMINI_API_KEYS = GEMINI_API_KEYS_RAW 
  ? GEMINI_API_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k)
  : [];

console.log(`✓ Configuration loaded`);
console.log(`  - Laravel: ${LARAVEL_BASE_URL}`);
console.log(`  - Google API Key: ${GOOGLE_API_KEY.substring(0, 10)}...`);
console.log(`  - Groq API Key: ${GROQ_API_KEY.substring(0, 10)}...`);
if (GEMINI_API_KEYS.length > 0) {
  console.log(`  - Gemini Fallback Keys: ${GEMINI_API_KEYS.length} key(s)`);
}

// Round-robin key selection for Gemini fallback
let currentGeminiKeyIndex = 0;

function getNextGeminiKey() {
  if (GEMINI_API_KEYS.length === 0) return null;
  const key = GEMINI_API_KEYS[currentGeminiKeyIndex];
  currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

// Helper: delay between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========== PHASE 2.1: DATA COLLECTION ==========

/**
 * Step 1: Fetch the latest article from Laravel API
 * Assumes articles are sorted by created_at DESC
 */
async function fetchLatestArticle() {
  console.log('\n📥 STEP 1: Fetching latest article from Laravel...');
  
  const url = `${LARAVEL_BASE_URL}/api/articles`;
  
  try {
    const response = await axios.get(url, {
      headers: { 'Accept': 'application/json' }
    });

    const articles = response.data.data;
    
    if (!articles || articles.length === 0) {
      throw new Error('No articles found. Run Laravel scraper first.');
    }

    // Assumption: Articles are sorted by created_at DESC
    const latest = articles[0];
    
    console.log(`   ✓ Found article ID: ${latest.id}`);
    console.log(`   ✓ Title: "${latest.title}"`);
    console.log(`   ✓ Content length: ${latest.content.length} chars`);
    
    return {
      id: latest.id,
      title: latest.title,
      content: latest.content
    };
  } catch (error) {
    console.error('   ❌ Failed to fetch article:', error.message);
    throw error;
  }
}

/**
 * Step 2: Search using Google Custom Search API
 * Uses JSON API - NO HTML scraping
 */
async function searchWithGoogleAPI(query) {
  console.log('\n🔍 STEP 2: Searching with Google Custom Search API...');
  
  // Clean the query: remove branding like "- BeyondChats" to get topical results
  const cleanQuery = query
    .replace(/- ?Beyondchats?/gi, '')  // Remove "- Beyondchats" or "- Beyondchat"
    .replace(/\|.*$/, '')              // Remove anything after pipe
    .trim();
  
  console.log(`   Original query: "${query}"`);
  console.log(`   Cleaned query: "${cleanQuery}"`);
  
  const searchUrl = 'https://www.googleapis.com/customsearch/v1';
  
  try {
    const response = await axios.get(searchUrl, {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSX_ENGINE_ID,
        q: cleanQuery,  // Use cleaned query
        num: 10  // Request 10 results to have options
      },
      timeout: 15000
    });

    const items = response.data.items || [];
    
    console.log(`   ✓ Got ${items.length} search results`);
    
    // Filter and validate results
    const validUrls = [];
    
    for (const item of items) {
      const url = item.link;
      
      // Filter criteria:
      // 1. Must be http/https
      // 2. Not BeyondChats or company-related sites
      // 3. Not social media, reviews, profiles
      // 4. Likely to be article/blog content
      if (!url || !url.startsWith('http')) continue;
      if (url.includes('beyondchats.com')) continue;
      if (url.includes('youtube.com')) continue;
      if (url.includes('facebook.com')) continue;
      if (url.includes('linkedin.com')) continue;
      if (url.includes('glassdoor.')) continue;
      if (url.includes('twitter.com')) continue;
      if (url.includes('instagram.com')) continue;
      if (url.includes('reddit.com')) continue;
      
      validUrls.push(url);
      
      // Stop after finding 2 valid URLs
      if (validUrls.length >= 2) break;
    }
    
    console.log(`   ✓ Selected ${validUrls.length} valid article URLs`);
    validUrls.forEach((url, i) => {
      console.log(`      ${i + 1}. ${url}`);
    });
    
    return validUrls;
    
  } catch (error) {
    console.error('   ❌ Google search failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Step 3: Scrape main content from article URL
 * Extracts only the main article body, ignoring nav/footer/ads
 */
async function scrapeArticleContent(url) {
  console.log(`   📄 Scraping: ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    // Try to find main content container
    // Priority: <article> > <main> > common content divs
    let contentRoot = $('article');
    if (!contentRoot.length) contentRoot = $('main');
    if (!contentRoot.length) contentRoot = $('#content, .content, .article-content, .post-content').first();
    if (!contentRoot.length) contentRoot = $('body');

    // Extract paragraphs, filtering out navigation/footer/header
    const paragraphs = [];
    
    contentRoot.find('p').each((_, elem) => {
      const parent = $(elem).parent();
      const parentTag = parent.prop('tagName') || '';
      const parentClass = parent.attr('class') || '';
      
      // Skip if parent is nav, footer, header, aside, or sidebar
      if (/nav|footer|header|aside|sidebar/i.test(parentTag)) return;
      if (/nav|footer|header|aside|sidebar|menu/i.test(parentClass)) return;

      const text = $(elem).text().replace(/\s+/g, ' ').trim();
      
      // Only include substantial paragraphs
      if (text.length > 50) {
        paragraphs.push(text);
      }
    });

    const content = paragraphs.join('\n\n');
    
    console.log(`      ✓ Extracted ${paragraphs.length} paragraphs (${content.length} chars)`);
    
    return { url, content };
    
  } catch (error) {
    console.error(`      ❌ Failed to scrape ${url}:`, error.message);
    return null;
  }
}

/**
 * Step 4: Collect reference articles by scraping the URLs
 */
async function collectReferenceArticles(articleTitle) {
  console.log('\n📚 STEP 3: Collecting reference articles...');
  
  // Search using Google Custom Search API
  const urls = await searchWithGoogleAPI(articleTitle);
  
  if (urls.length === 0) {
    throw new Error('No valid search results found');
  }
  
  const referenceArticles = [];
  
  // Scrape each URL
  for (const url of urls) {
    const article = await scrapeArticleContent(url);
    
    if (article && article.content && article.content.length > 300) {
      referenceArticles.push(article);
    }
    
    // Be polite: wait 1s between scrapes
    await sleep(1000);
    
    // Stop after collecting 2 articles
    if (referenceArticles.length >= 2) break;
  }
  
  if (referenceArticles.length === 0) {
    throw new Error('Could not scrape any reference articles');
  }
  
  console.log(`   ✓ Collected ${referenceArticles.length} reference article(s)`);
  
  return referenceArticles;
}

// ========== PHASE 2.2: LLM PROCESSING & PUBLISHING ==========

/**
 * Step 5: Rewrite article using LLM
 * Primary: Groq (Mixtral)
 * Fallback: Gemini (if Groq fails)
 */
async function rewriteArticleWithLLM(originalArticle, referenceArticles) {
  console.log('\n🤖 STEP 4: Rewriting article with LLM...');
  
  // Build reference summary
  const referenceSummary = referenceArticles
    .map((ref, idx) => `
Reference Article ${idx + 1}:
URL: ${ref.url}

Content:
${ref.content}
`).join('\n---\n');

  const prompt = `You are an expert blog editor. Your task:

1. Rewrite the ORIGINAL ARTICLE to improve:
   - Formatting and structure
   - Clarity and readability
   - Professional tone similar to top-ranking blog posts

2. Use REFERENCE ARTICLES for style inspiration ONLY
   - DO NOT copy text from references
   - DO NOT plagiarize
   - Preserve the original article's meaning and key points

3. Return ONLY the rewritten article body
   - DO NOT add a References section (will be added separately)
   - Use clear headings and paragraphs
   - Keep it engaging and informative

ORIGINAL ARTICLE:
-----------------
${originalArticle.content}

REFERENCE ARTICLES (for style only):
------------------------------------
${referenceSummary}

Please rewrite the ORIGINAL ARTICLE following the instructions above.`;

  // Try Groq first (PRIMARY)
  try {
    console.log('   🔑 Using Groq API (Primary)');
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      timeout: 60000
    });

    const text = response.data?.choices?.[0]?.message?.content;
    
    if (!text || !text.trim()) {
      throw new Error('Groq returned empty content');
    }

    console.log(`   ✓ Article rewritten with Groq (${text.length} chars)`);
    return text.trim();
    
  } catch (groqError) {
    console.warn(`   ⚠️ Groq failed: ${groqError.message}`);
    if (groqError.response) {
      console.error('   Groq response:', JSON.stringify(groqError.response.data, null, 2));
    }
    
    // Try Gemini as fallback
    if (GEMINI_API_KEYS.length > 0) {
      console.log('   🔄 Falling back to Gemini API...');
      
      const geminiKey = getNextGeminiKey();
      const keyNum = currentGeminiKeyIndex === 0 ? GEMINI_API_KEYS.length : currentGeminiKeyIndex;
      
      console.log(`   🔑 Using Gemini API key #${keyNum}`);
      
      const geminiPayload = {
        contents: [{
          parts: [{ text: prompt }]
        }]
      };
      
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`;
        
        const response = await axios.post(geminiUrl, geminiPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        });

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
          throw new Error('Gemini returned no candidates');
        }

        const text = candidates[0]?.content?.parts?.[0]?.text;
        if (!text || !text.trim()) {
          throw new Error('Gemini returned empty content');
        }

        console.log(`   ✓ Article rewritten with Gemini (${text.length} chars)`);
        return text.trim();
        
      } catch (geminiError) {
        console.error('   ❌ Gemini also failed:', geminiError.message);
        throw new Error('Both Groq and Gemini failed to rewrite article');
      }
    }
    
    // No fallback available
    throw new Error('Groq failed and no Gemini fallback configured');
  }
}

/**
 * Step 6: Append References section
 */
function appendReferences(rewrittenContent, referenceArticles) {
  console.log('\n📎 STEP 5: Appending references...');
  
  const references = [
    '\n\n---\n',
    'References:',
    ...referenceArticles.map((ref, idx) => `${idx + 1}. ${ref.url}`)
  ].join('\n');

  const finalContent = rewrittenContent + references;
  
  console.log(`   ✓ Added ${referenceArticles.length} reference(s)`);
  
  return finalContent;
}

/**
 * Step 7: Publish updated article back to Laravel
 */
async function publishToLaravel(articleId, updatedContent) {
  console.log('\n📤 STEP 6: Publishing updated article to Laravel...');
  
  const url = `${LARAVEL_BASE_URL}/api/articles/${articleId}`;
  
  try {
    const response = await axios.put(url, 
      { content: updatedContent },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Laravel API returned status ${response.status}`);
    }

    console.log(`   ✓ Article ID ${articleId} updated successfully`);
    console.log(`   ✓ Updated content length: ${updatedContent.length} chars`);
    
  } catch (error) {
    console.error('   ❌ Failed to publish:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
}

// ========== MAIN ORCHESTRATION ==========

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   BeyondChats Phase 2 Worker - START      ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // PHASE 2.1: Data Collection
    const originalArticle = await fetchLatestArticle();
    const referenceArticles = await collectReferenceArticles(originalArticle.title);

    // PHASE 2.2: LLM Processing & Publishing
    const rewrittenContent = await rewriteArticleWithLLM(originalArticle, referenceArticles);
    const finalContent = appendReferences(rewrittenContent, referenceArticles);
    await publishToLaravel(originalArticle.id, finalContent);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   ✓ Phase 2 Completed Successfully!       ║');
    console.log('╚════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Worker failed:', error.message);
    process.exit(1);
  }
}

// Run the worker
main();

/**
 * BeyondChats Phase 2 - NodeJS Worker (REFACTORED)
 * 
 * Changes:
 * 1. LLM-driven reference discovery (primary path)
 * 2. API key load balancing (round-robin)
 * 3. Fallback URLs as last resort only
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

// ========== CONFIGURATION ==========
const LARAVEL_BASE_URL = process.env.LARAVEL_BASE_URL || 'http://localhost:8000';
const LLM_API_KEYS_RAW = process.env.LLM_API_KEYS;

if (!LLM_API_KEYS_RAW) {
  console.error('❌ Error: LLM_API_KEYS not set in .env file');
  process.exit(1);
}

// Parse multiple API keys
const LLM_API_KEYS = LLM_API_KEYS_RAW.split(',').map(k => k.trim()).filter(k => k);

if (LLM_API_KEYS.length === 0) {
  console.error('❌ Error: No valid LLM API keys found');
  process.exit(1);
}

console.log(`✓ Loaded ${LLM_API_KEYS.length} LLM API key(s)`);

// Round-robin key selection
let currentKeyIndex = 0;

function getNextApiKey() {
  const key = LLM_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % LLM_API_KEYS.length;
  return key;
}

function buildGeminiUrl(apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
}

// Helper: delay between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// FALLBACK: Curated article URLs (LAST RESORT ONLY)
const FALLBACK_REFERENCE_URLS = [
  'https://www.sba.gov/business-guide/10-steps-start-your-business',
  'https://www.businessnewsdaily.com/4686-how-to-start-a-business.html',
  'https://www.entrepreneur.com/starting-a-business',
  'https://www.inc.com/guides/start-a-business.html'
];

// ========== PHASE 2.1: DATA COLLECTION ==========

/**
 * Step 3: Fetch the latest article from Laravel API
 */
async function fetchLatestArticle() {
  console.log('\n📥 Step 3: Fetching latest article from Laravel API...');
  
  const url = `${LARAVEL_BASE_URL}/api/articles`;
  const response = await axios.get(url, {
    headers: { 'Accept': 'application/json' }
  });

  const articles = response.data.data;
  
  if (!articles || articles.length === 0) {
    throw new Error('No articles found. Run Laravel scraper first.');
  }

  const latest = articles[0];
  
  console.log(`   ✓ Found article ID: ${latest.id}`);
  console.log(`   ✓ Title: ${latest.title}`);
  
  return {
    id: latest.id,
    title: latest.title,
    content: latest.content
  };
}

/**
 * Step 4: Use LLM to discover reference articles (PRIMARY PATH)
 */
async function discoverReferencesWithLLM(articleTitle) {
  console.log('\n🔍 Step 4: Using LLM to discover reference articles...');
  console.log(`   Article: "${articleTitle}"`);
  
  const prompt = `You are a research assistant.

Given the following blog article title:
"${articleTitle}"

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
Do not invent URLs. Prefer well-known publishers.`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  try {
    const apiKey = getNextApiKey();
    const geminiUrl = buildGeminiUrl(apiKey);
    
    console.log(`   🔑 Using API key #${currentKeyIndex === 0 ? LLM_API_KEYS.length : currentKeyIndex}`);
    
    const response = await axios.post(geminiUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('LLM returned no candidates');
    }

    const text = candidates[0]?.content?.parts?.[0]?.text;
    if (!text || !text.trim()) {
      throw new Error('LLM returned empty content');
    }

    console.log('   ✓ LLM response received');
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.references || !Array.isArray(parsed.references)) {
      throw new Error('Invalid JSON structure: missing references array');
    }

    if (parsed.references.length !== 2) {
      throw new Error(`Expected 2 references, got ${parsed.references.length}`);
    }

    // Validate each reference
    for (const ref of parsed.references) {
      if (!ref.url || !ref.url.startsWith('http')) {
        throw new Error(`Invalid URL: ${ref.url}`);
      }
      if (!ref.content || ref.content.length < 100) {
        throw new Error('Reference content too short');
      }
    }

    console.log('   ✓ Validated 2 reference URLs from LLM');
    parsed.references.forEach((ref, i) => {
      console.log(`      ${i + 1}. ${ref.url}`);
    });

    return parsed.references;

  } catch (error) {
    console.warn(`   ⚠️ LLM reference discovery failed: ${error.message}`);
    return null;
  }
}

/**
 * Step 5: Scrape content from external article URL
 */
async function scrapeArticle(url) {
  console.log(`   📄 Scraping: ${url}`);
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);

  // Extract title
  let title = $('meta[property="og:title"]').attr('content') ||
              $('meta[name="twitter:title"]').attr('content') ||
              $('title').text() || 
              '';
  title = title.trim();

  // Extract main content (heuristic approach)
  let contentRoot = $('article');
  if (!contentRoot.length) contentRoot = $('main');
  if (!contentRoot.length) contentRoot = $('#content, .content, .article-content, .post-content').first();
  if (!contentRoot.length) contentRoot = $('body');

  // Collect paragraphs, filter out nav/footer/header
  const paragraphs = [];
  contentRoot.find('p').each((_, p) => {
    const parent = $(p).parent();
    const parentTag = parent.prop('tagName') || '';
    const parentClass = parent.attr('class') || '';
    
    // Skip navigation, footer, header, sidebar
    if (/nav|footer|header|aside|sidebar/i.test(parentTag)) return;
    if (/nav|footer|header|aside|sidebar|menu/i.test(parentClass)) return;

    const text = $(p).text().replace(/\s+/g, ' ').trim();
    if (text.length > 50) {
      paragraphs.push(text);
    }
  });

  const content = paragraphs.join('\n\n');

  console.log(`      ✓ Extracted ${paragraphs.length} paragraphs`);

  return { url, title, content };
}

/**
 * Step 5-6: Collect 2 reference articles (REFACTORED)
 * Priority: LLM discovery → Scraping → Fallback
 */
async function collectReferenceArticles(originalArticle) {
  console.log('\n📚 Step 5-6: Collecting reference articles...');
  
  let llmReferences = null;
  let usedFallback = false;
  
  // ATTEMPT 1: LLM-driven discovery (PRIMARY PATH)
  llmReferences = await discoverReferencesWithLLM(originalArticle.title);
  
  let referencesToScrape = [];
  
  if (llmReferences && llmReferences.length === 2) {
    console.log('   ✓ Using LLM-discovered references');
    referencesToScrape = llmReferences.map(r => r.url);
  } else {
    console.warn('   ⚠️ LLM discovery failed or invalid');
    console.log('   🔄 Falling back to curated reference URLs...');
    referencesToScrape = FALLBACK_REFERENCE_URLS.slice(0, 4);
    usedFallback = true;
  }

  // ATTEMPT 2: Scrape the selected URLs
  const referenceArticles = [];
  
  for (const url of referencesToScrape) {
    try {
      const article = await scrapeArticle(url);
      
      if (article.content && article.content.length > 300) {
        referenceArticles.push(article);
        console.log(`      ✓ Added reference article`);
      } else {
        console.log(`      ⚠ Skipped (content too short)`);
      }
      
      // Be polite: wait 1s between scrapes
      await sleep(1000);
      
      if (referenceArticles.length >= 2) break;
    } catch (error) {
      console.log(`      ⚠ Failed to scrape: ${error.message}`);
    }
  }

  // ATTEMPT 3: If scraping failed, use LLM-provided content directly
  if (referenceArticles.length < 2 && llmReferences && !usedFallback) {
    console.log('   🔄 Scraping failed, using LLM-provided content summaries...');
    
    for (const ref of llmReferences) {
      if (referenceArticles.length >= 2) break;
      
      referenceArticles.push({
        url: ref.url,
        title: 'Summary from LLM',
        content: ref.content
      });
      console.log(`      ✓ Using LLM summary for ${ref.url}`);
    }
  }

  if (referenceArticles.length === 0) {
    throw new Error('Could not collect any reference articles');
  }

  console.log(`   ✓ Collected ${referenceArticles.length} reference article(s)`);
  if (usedFallback) {
    console.log('   📌 Note: Used fallback curated URLs');
  }
  
  return referenceArticles;
}

// ========== PHASE 2.2: LLM PROCESSING & PUBLISHING ==========

/**
 * Step 7-8: Call LLM to rewrite article (with retry on 429)
 */
async function rewriteWithLLM(originalArticle, referenceArticles) {
  console.log('\n🤖 Step 7-8: Calling LLM (Gemini) to rewrite article...');
  
  // Build reference summary
  const referenceSummary = referenceArticles
    .map((ref, idx) => `
Reference Article ${idx + 1}:
URL: ${ref.url}
Title: ${ref.title}

Content:
${ref.content}
`).join('\n---\n');

  const systemPrompt = `You are an expert blog editor. Your task:

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
   - Keep it engaging and informative`;

  const userPrompt = `
ORIGINAL ARTICLE:
-----------------
${originalArticle.content}

REFERENCE ARTICLES (for style only):
------------------------------------
${referenceSummary}

Please rewrite the ORIGINAL ARTICLE following the instructions above.`;

  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { text: '\n\n' },
        { text: userPrompt }
      ]
    }]
  };

  // Try each API key with retry on 429
  const maxRetries = LLM_API_KEYS.length * 2; // Try each key twice
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getNextApiKey();
    const geminiUrl = buildGeminiUrl(apiKey);
    const keyNum = currentKeyIndex === 0 ? LLM_API_KEYS.length : currentKeyIndex;
    
    console.log(`   🔑 Attempt ${attempt + 1}/${maxRetries}: Using API key #${keyNum}`);

    try {
      const response = await axios.post(geminiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      });

      const candidates = response.data?.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('LLM returned no candidates');
      }

      const text = candidates[0]?.content?.parts?.[0]?.text;
      if (!text || !text.trim()) {
        throw new Error('LLM returned empty content');
      }

      console.log('   ✓ Article rewritten by LLM');
      return text.trim();
      
    } catch (error) {
      lastError = error;
      
      if (error.response?.status === 429) {
        // Rate limited - extract retry delay from error
        const retryMatch = error.response?.data?.error?.message?.match(/retry in ([\d.]+)s/);
        const retryDelay = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 15;
        
        console.warn(`   ⚠️ Rate limited. Waiting ${retryDelay}s before retry...`);
        await sleep(retryDelay * 1000);
        continue;
      }
      
      // Non-429 error - throw immediately
      throw error;
    }
  }
  
  // All retries exhausted
  throw lastError || new Error('All API keys exhausted');
}

/**
 * Step 9: Append References section
 */
function appendReferences(rewrittenContent, referenceArticles) {
  console.log('\n📎 Step 9: Appending References section...');
  
  const references = [
    '\n\n---\n',
    'References:',
    ...referenceArticles.map((ref, idx) => `${idx + 1}. ${ref.url}`)
  ].join('\n');

  return rewrittenContent + references;
}

/**
 * Step 10: Publish updated article back to Laravel
 */
async function publishToLaravel(articleId, updatedContent) {
  console.log('\n📤 Step 10: Publishing updated article to Laravel...');
  
  const url = `${LARAVEL_BASE_URL}/api/articles/${articleId}`;
  
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

  console.log('   ✓ Article updated successfully in Laravel');
}

// ========== MAIN ORCHESTRATION ==========

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  BeyondChats Phase 2 Worker (REFACTORED)  ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // PHASE 2.1: Data Collection
    const originalArticle = await fetchLatestArticle();
    const referenceArticles = await collectReferenceArticles(originalArticle);

    // PHASE 2.2: LLM Processing & Publishing
    const rewrittenContent = await rewriteWithLLM(originalArticle, referenceArticles);
    const finalContent = appendReferences(rewrittenContent, referenceArticles);
    await publishToLaravel(originalArticle.id, finalContent);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  ✓ Phase 2 Completed Successfully!        ║');
    console.log('╚════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Worker failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the worker
main();

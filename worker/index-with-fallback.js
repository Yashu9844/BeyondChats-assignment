/**
 * BeyondChats Phase 2 Worker - WITH FALLBACK URLs
 * 
 * This version includes hardcoded fallback URLs for when Google blocks scraping.
 * Use this for testing if Google search fails.
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

// ========== CONFIGURATION ==========
const LARAVEL_BASE_URL = process.env.LARAVEL_BASE_URL || 'http://localhost:8000';
const LLM_API_KEY = process.env.LLM_API_KEY;

if (!LLM_API_KEY) {
  console.error('❌ Error: LLM_API_KEY not set in .env file');
  process.exit(1);
}

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${LLM_API_KEY}`;

// FALLBACK: Use these URLs if Google search fails
const FALLBACK_URLS = [
  'https://www.forbes.com/advisor/business/small-business-guide/',
  'https://www.sba.gov/business-guide/10-steps-start-your-business'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Copy all the other functions from index.js...
// (fetch, search, scrape, llm, publish)

// Then in collectReferenceArticles:
async function collectReferenceArticles(originalArticle) {
  console.log('\n📚 Step 5-6: Collecting reference articles...');
  
  let searchUrls = [];
  
  try {
    // Try Google search first
    searchUrls = await googleSearch(originalArticle.title);
  } catch (error) {
    console.warn('   ⚠️ Google search failed:', error.message);
  }
  
  // If no results, use fallback URLs
  if (searchUrls.length === 0) {
    console.log('   🔄 Using fallback reference URLs...');
    searchUrls = FALLBACK_URLS;
  }

  const referenceArticles = [];
  
  for (const url of searchUrls.slice(0, 2)) {
    try {
      const article = await scrapeArticle(url);
      
      if (article.content && article.content.length > 300) {
        referenceArticles.push(article);
        console.log(`      ✓ Added reference article`);
      } else {
        console.log(`      ⚠ Skipped (content too short)`);
      }
      
      await sleep(1000);
      
      if (referenceArticles.length >= 2) break;
    } catch (error) {
      console.log(`      ⚠ Failed to scrape: ${error.message}`);
    }
  }

  if (referenceArticles.length === 0) {
    throw new Error('Could not scrape any reference articles');
  }

  console.log(`   ✓ Collected ${referenceArticles.length} reference article(s)`);
  
  return referenceArticles;
}

// Note: Copy rest of functions from index.js
console.log('Use index.js for main implementation. This is just a reference for fallback approach.');

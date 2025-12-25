<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ArticleScraperService
{
    private const BASE_URL = 'https://beyondchats.com/blogs';
    
    /**
     * Scrape only ONE new article from any page (starts from last page, goes backwards)
     * 
     * @return array
     */
    public function scrapeOldestArticles(): array
    {
        // Step 1: Get the last page number
        $lastPageNumber = $this->getLastPageNumber();
        
        // Step 2: Try each page starting from last, going backwards
        // This ensures we get the oldest articles first
        for ($pageNum = $lastPageNumber; $pageNum >= 1; $pageNum--) {
            $articleUrls = $this->getArticleUrlsFromPage($pageNum);
            
            // Step 3: Find the first article that doesn't exist yet
            foreach ($articleUrls as $url) {
                // Quick check: does this URL exist?
                $exists = \App\Models\Article::where('source_url', $url)->exists();
                
                if (!$exists) {
                    // URL doesn't exist, now scrape it
                    $article = $this->scrapeArticleContent($url);
                    
                    if ($article) {
                        // Found a new article, return just this one
                        return [$article];
                    }
                }
            }
        }
        
        // If all articles from all pages exist, return empty
        return [];
    }
    
    /**
     * Get the last page number from the blog listing
     * 
     * @return int
     */
    private function getLastPageNumber(): int
    {
        $response = Http::get(self::BASE_URL);
        
        if (!$response->successful()) {
            throw new \Exception('Failed to fetch blog listing page');
        }
        
        $html = $response->body();
        
        // Parse HTML to find pagination
        // Looking for pagination links
        preg_match_all('/blogs\/page\/(\d+)/', $html, $matches);
        
        if (!empty($matches[1])) {
            return max($matches[1]);
        }
        
        // If no pagination found, we're on the only page
        return 1;
    }
    
    /**
     * Get article URLs from a specific page
     * 
     * @param int $pageNumber
     * @return array
     */
    private function getArticleUrlsFromPage(int $pageNumber): array
    {
        $url = $pageNumber > 1 
            ? self::BASE_URL . "/page/{$pageNumber}" 
            : self::BASE_URL;
        
        $response = Http::get($url);
        
        if (!$response->successful()) {
            throw new \Exception("Failed to fetch page {$pageNumber}");
        }
        
        $html = $response->body();
        
        // Extract article URLs
        // Looking for links to individual blog posts
        preg_match_all('/<a[^>]+href="(https:\/\/beyondchats\.com\/blogs\/[^"]+)"[^>]*>/', $html, $matches);
        
        if (empty($matches[1])) {
            return [];
        }
        
        // Remove duplicates and filter out pagination links
        $urls = array_unique($matches[1]);
        $urls = array_filter($urls, function($url) {
            return !str_contains($url, '/page/');
        });
        
        return array_values($urls);
    }
    
    /**
     * Scrape full content from a single article
     * 
     * @param string $url
     * @return array|null
     */
    private function scrapeArticleContent(string $url): ?array
    {
        $response = Http::get($url);
        
        if (!$response->successful()) {
            return null;
        }
        
        $html = $response->body();
        
        // Extract title
        $title = $this->extractTitle($html);
        
        // Extract content
        $content = $this->extractContent($html);
        
        // Extract published date
        $publishedAt = $this->extractPublishedDate($html);
        
        if (!$title || !$content) {
            return null;
        }
        
        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'content' => $content,
            'source_url' => $url,
            'published_at' => $publishedAt,
        ];
    }
    
    /**
     * Extract title from HTML
     * 
     * @param string $html
     * @return string|null
     */
    private function extractTitle(string $html): ?string
    {
        // Try multiple patterns for title extraction
        $patterns = [
            '/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/',
            '/<h1[^>]*>([^<]+)<\/h1>/',
            '/<title>([^<]+)<\/title>/',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $matches)) {
                return trim(strip_tags($matches[1]));
            }
        }
        
        return null;
    }
    
    /**
     * Extract main content from HTML
     * 
     * @param string $html
     * @return string|null
     */
    private function extractContent(string $html): ?string
    {
        // Try multiple patterns for content extraction
        $patterns = [
            '/<article[^>]*>(.*?)<\/article>/s',
            '/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>(.*?)<\/div>/s',
            '/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/s',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $matches)) {
                $content = $matches[1];
                // Clean up the content
                $content = strip_tags($content, '<p><br><strong><em><ul><ol><li><h2><h3><h4>');
                return trim($content);
            }
        }
        
        return null;
    }
    
    /**
     * Extract published date from HTML
     * 
     * @param string $html
     * @return string|null
     */
    private function extractPublishedDate(string $html): ?string
    {
        $patterns = [
            '/<time[^>]+datetime="([^"]+)"/',
            '/<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/',
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $html, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
}

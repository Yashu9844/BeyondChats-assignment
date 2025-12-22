<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ArticleScraperService;
use App\Models\Article;

class ScrapeBeyondChatsBlogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scrape:beyondchats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape the 5 oldest articles from the last page of BeyondChats blogs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting BeyondChats blog scraper...');
        
        try {
            // Initialize scraper service
            $scraper = new ArticleScraperService();
            
            $this->info('Fetching articles from BeyondChats...');
            
            // Scrape articles
            $articles = $scraper->scrapeOldestArticles();
            
            if (empty($articles)) {
                $this->warn('No articles found to scrape.');
                return Command::SUCCESS;
            }
            
            $articleCount = count($articles);
            $this->info("Found {$articleCount} articles. Processing...");
            
            $newCount = 0;
            $skippedCount = 0;
            
            // Process and store each article
            foreach ($articles as $articleData) {
                // Check if article already exists (by source_url or slug)
                $exists = Article::where('source_url', $articleData['source_url'])
                    ->orWhere('slug', $articleData['slug'])
                    ->exists();
                
                if ($exists) {
                    $this->warn("Skipped: '{$articleData['title']}' (already exists)");
                    $skippedCount++;
                    continue;
                }
                
                // Insert new article
                Article::create($articleData);
                $this->info("Saved: '{$articleData['title']}'");
                $newCount++;
            }
            
            $this->newLine();
            $this->info("✓ Scraping completed!");
            $this->info("New articles: {$newCount}");
            $this->info("Skipped (duplicates): {$skippedCount}");
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('Error occurred while scraping: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}

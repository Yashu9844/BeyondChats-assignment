<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;

class KeepOldestArticles extends Command
{
    protected $signature = 'articles:keep-oldest';
    protected $description = 'Keep only the 5 oldest articles and delete the rest';

    public function handle()
    {
        // Get IDs of 5 oldest articles
        $keepIds = Article::orderBy('published_at', 'asc')
            ->take(5)
            ->pluck('id');
        
        // Delete all other articles
        $deleted = Article::whereNotIn('id', $keepIds)->delete();
        
        $this->info("✓ Kept 5 oldest articles");
        $this->info("✓ Deleted {$deleted} articles");
        
        return Command::SUCCESS;
    }
}

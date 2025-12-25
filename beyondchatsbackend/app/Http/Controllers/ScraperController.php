<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class ScraperController extends Controller
{
    /**
     * Trigger the scraper to fetch one more old article
     */
    public function scrapeArticle()
    {
        try {
            // Run the scraper command
            Artisan::call('scrape:beyondchats');
            
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'Article scraping completed',
                'output' => $output
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to scrape article',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

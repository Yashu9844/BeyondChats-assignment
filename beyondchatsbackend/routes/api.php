<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\ScraperController;
use App\Http\Controllers\EnhancementController;

// Article CRUD endpoints (no authentication required)
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{id}', [ArticleController::class, 'show']);
Route::post('/articles', [ArticleController::class, 'store']);
Route::put('/articles/{id}', [ArticleController::class, 'update']);
Route::delete('/articles/{id}', [ArticleController::class, 'destroy']);

// Scraper endpoint
Route::post('/scrape', [ScraperController::class, 'scrapeArticle']);

// Enhancement endpoint (runs Phase 2 worker)
Route::post('/enhance/{id}', [EnhancementController::class, 'enhanceArticle']);

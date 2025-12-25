<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use App\Models\Article;

class EnhancementController extends Controller
{
    /**
     * Enhance a specific article using the Node worker (Phase 2)
     */
    public function enhanceArticle($id)
    {
        try {
            // Check if article exists
            $article = Article::find($id);
            
            if (!$article) {
                return response()->json([
                    'success' => false,
                    'message' => 'Article not found'
                ], 404);
            }
            
            // Run the Node worker
            // Worker is in: C:\Users\yashwanth\Desktop\BeyondChat\workernode
            $workerPath = base_path('../workernode');
            
            // Run node index.js with article ID as environment variable
            $result = Process::path($workerPath)
                ->env(['ARTICLE_ID' => $id])
                ->run('node index.js');
            
            if ($result->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Article enhanced successfully',
                    'output' => $result->output()
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Worker failed',
                    'error' => $result->errorOutput()
                ], 500);
            }
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to enhance article',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

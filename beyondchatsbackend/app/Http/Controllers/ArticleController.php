<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Article;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    /**
     * Display a listing of all articles.
     * GET /api/articles
     */
    public function index()
    {
        $articles = Article::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $articles,
        ]);
    }

    /**
     * Display a single article by ID.
     * GET /api/articles/{id}
     */
    public function show(string $id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $article,
        ]);
    }

    /**
     * Create a new article.
     * POST /api/articles
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:articles,slug',
            'content' => 'required|string',
            'source_url' => 'nullable|url',
            'published_at' => 'nullable|date',
        ]);
        
        // Auto-generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }
        
        $article = Article::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Article created successfully',
            'data' => $article,
        ], 201);
    }

    /**
     * Update an existing article.
     * PUT /api/articles/{id}
     */
    public function update(Request $request, string $id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found',
            ], 404);
        }
        
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|unique:articles,slug,' . $id,
            'content' => 'sometimes|required|string',
            'source_url' => 'nullable|url',
            'published_at' => 'nullable|date',
        ]);
        
        // Auto-generate slug if title is updated but slug is not provided
        if (isset($validated['title']) && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }
        
        $article->update($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Article updated successfully',
            'data' => $article,
        ]);
    }

    /**
     * Delete an article.
     * DELETE /api/articles/{id}
     */
    public function destroy(string $id)
    {
        $article = Article::find($id);
        
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article not found',
            ], 404);
        }
        
        $article->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Article deleted successfully',
        ]);
    }
}

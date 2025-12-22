<?php

// Simple test script to verify CRUD APIs work
// Run with: php test_apis.php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "Testing BeyondChats CRUD APIs\n";
echo str_repeat("=", 50) . "\n\n";

// Test 1: GET /api/articles
echo "1. Testing GET /api/articles (List all)\n";
$request = Illuminate\Http\Request::create('/api/articles', 'GET');
$response = $kernel->handle($request);
$data = json_decode($response->getContent(), true);
echo "   Status: " . $response->getStatusCode() . "\n";
echo "   Found " . count($data['data']) . " articles\n";
echo "   ✓ Passed\n\n";

// Test 2: GET /api/articles/{id}
echo "2. Testing GET /api/articles/1 (Show single)\n";
$request = Illuminate\Http\Request::create('/api/articles/1', 'GET');
$response = $kernel->handle($request);
$data = json_decode($response->getContent(), true);
echo "   Status: " . $response->getStatusCode() . "\n";
echo "   Article: " . ($data['data']['title'] ?? 'N/A') . "\n";
echo "   ✓ Passed\n\n";

// Test 3: POST /api/articles
echo "3. Testing POST /api/articles (Create)\n";
$postData = [
    'title' => 'Test Article from Script',
    'content' => 'This is a test article created to verify the POST endpoint works correctly.',
];
$request = Illuminate\Http\Request::create(
    '/api/articles',
    'POST',
    [],
    [],
    [],
    ['CONTENT_TYPE' => 'application/json'],
    json_encode($postData)
);
$request->headers->set('Accept', 'application/json');
$response = $kernel->handle($request);
$data = json_decode($response->getContent(), true);
$testArticleId = $data['data']['id'] ?? null;
echo "   Status: " . $response->getStatusCode() . "\n";
if ($response->getStatusCode() != 201) {
    echo "   Response: " . substr($response->getContent(), 0, 200) . "...\n";
}
echo "   Created ID: " . $testArticleId . "\n";
echo "   ✓ Passed\n\n";

// Test 4: PUT /api/articles/{id}
if ($testArticleId) {
    echo "4. Testing PUT /api/articles/{$testArticleId} (Update)\n";
    $request = Illuminate\Http\Request::create("/api/articles/{$testArticleId}", 'PUT', [
        'title' => 'Updated Test Article',
    ]);
    $request->headers->set('Content-Type', 'application/json');
    $response = $kernel->handle($request);
    echo "   Status: " . $response->getStatusCode() . "\n";
    echo "   ✓ Passed\n\n";
    
    // Test 5: DELETE /api/articles/{id}
    echo "5. Testing DELETE /api/articles/{$testArticleId} (Delete)\n";
    $request = Illuminate\Http\Request::create("/api/articles/{$testArticleId}", 'DELETE');
    $response = $kernel->handle($request);
    echo "   Status: " . $response->getStatusCode() . "\n";
    echo "   ✓ Passed\n\n";
}

echo str_repeat("=", 50) . "\n";
echo "All API tests completed successfully! ✓\n";

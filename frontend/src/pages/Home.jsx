import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { articleService } from '../services/api';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [enhancing, setEnhancing] = useState({});
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await articleService.getAll();
        setArticles(data);
        setIsDemo(articleService.isUsingMockData());
      } catch (err) {
        setError('Failed to load articles. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Separate articles into original and AI-enhanced
  const originalArticles = articles.filter(article => !article.content.includes('---\n\nReferences:'));
  const enhancedArticles = articles.filter(article => article.content.includes('---\n\nReferences:'));

  // Function to enhance article with AI (runs Phase 2 worker)
  const handleEnhanceArticle = async (articleId) => {
    setEnhancing(prev => ({ ...prev, [articleId]: true }));
    try {
      const baseUrl = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';
      const workerUrl = `${baseUrl}/enhance/${articleId}`;
      
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await articleService.getAll();
        setArticles(data);
        alert('✓ Article enhanced with AI and references!');
      } else {
        alert('Failed to enhance article. Please try again.');
      }
    } catch (err) {
      console.error('Enhancement error:', err);
      alert('Error enhancing article: ' + err.message);
    } finally {
      setEnhancing(prev => ({ ...prev, [articleId]: false }));
    }
  };

  // Function to trigger Laravel scraper and fetch new article
  const handleAddMoreArticle = async () => {
    setScraping(true);
    try {
      const baseUrl = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';
      const scraperUrl = `${baseUrl}/scrape`;
      
      const response = await fetch(scraperUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await articleService.getAll();
        setArticles(data);
        alert('✓ New article added successfully!');
      } else {
        alert('Failed to scrape new article. Please try again.');
      }
    } catch (err) {
      console.error('Scraping error:', err);
      alert('Error scraping article: ' + err.message);
    } finally {
      setScraping(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to clean HTML from content
  const cleanContent = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin"></div>
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg hover:bg-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Demo Mode:</strong> Backend server is offline. Showing sample articles to demonstrate the UI.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight mb-2">
              BeyondChats
            </h1>
            <p className="text-sm text-zinc-500">
              AI-enhanced articles with curated references
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* AI-Enhanced Articles Section */}
        {enhancedArticles.length > 0 && (
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs font-medium rounded-md">
                  AI Enhanced
                </span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-50">
                Enhanced Articles
              </h2>
            </motion.div>

            <div className="space-y-4">
              {enhancedArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                >
                  <Link
                    to={`/article/${article.id}`}
                    className="block group"
                  >
                    <div className="border border-zinc-800/50 rounded-xl p-8 hover:border-zinc-700/50 hover:bg-zinc-900/20 transition-all duration-200">
                      <div className="flex items-start justify-between gap-6 mb-4">
                        <div className="flex-1">
                          <time className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                            {formatDate(article.published_at)}
                          </time>
                          <h3 className="text-2xl font-semibold text-zinc-50 mt-2 mb-3 group-hover:text-zinc-200 transition-colors">
                            {cleanContent(article.title)}
                          </h3>
                          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                            {cleanContent(article.content).substring(0, 200)}...
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 group-hover:bg-zinc-800 group-hover:border-zinc-700 group-hover:text-zinc-300 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {/* Original Articles Section */}
        {originalArticles.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-12 flex items-end justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs font-medium rounded-md">
                    Original
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-50">
                  {originalArticles.length} Classic Articles
                </h2>
              </div>
              
              <button
                onClick={handleAddMoreArticle}
                disabled={scraping || isDemo}
                title={isDemo ? "Backend server required for this feature" : "Add new article"}
                className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scraping ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Article
                  </>
                )}
              </button>
            </motion.div>

            <div className="space-y-4">
              {originalArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.4 }}
                >
                  <Link
                    to={`/article/${article.id}`}
                    className="block group"
                  >
                    <div className="border border-zinc-800/50 rounded-xl p-8 hover:border-zinc-700/50 hover:bg-zinc-900/20 transition-all duration-200">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <time className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                            {formatDate(article.published_at)}
                          </time>
                          <h3 className="text-2xl font-semibold text-zinc-50 mt-2 mb-3 group-hover:text-zinc-200 transition-colors">
                            {cleanContent(article.title)}
                          </h3>
                          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                            {cleanContent(article.content).substring(0, 200)}...
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 group-hover:bg-zinc-800 group-hover:border-zinc-700 group-hover:text-zinc-300 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <div className="text-center py-24">
            <p className="text-zinc-500">No articles found</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <p className="text-xs text-zinc-500">
            © 2025 BeyondChats
          </p>
        </div>
      </footer>
    </div>
  );
}

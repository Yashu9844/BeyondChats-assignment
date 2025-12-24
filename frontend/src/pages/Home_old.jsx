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

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await articleService.getAll();
        setArticles(data);
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
  // AI-enhanced articles have references section (contains '---' and 'References:')
  const originalArticles = articles.filter(article => !article.content.includes('---\n\nReferences:'));
  const enhancedArticles = articles.filter(article => article.content.includes('---\n\nReferences:'));

  // Function to enhance article with AI (runs Phase 2 worker)
  const handleEnhanceArticle = async (articleId) => {
    setEnhancing(prev => ({ ...prev, [articleId]: true }));
    try {
      const baseUrl = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';
      const workerUrl = `${baseUrl}/enhance/${articleId}`;
      
      console.log('Enhancing article:', articleId);
      
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Enhancement result:', result);
        
        // Refresh articles list
        const data = await articleService.getAll();
        setArticles(data);
        alert('✓ Article enhanced with AI and references!');
      } else {
        const errorText = await response.text();
        console.error('Enhancement error:', errorText);
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
      // Get the base URL correctly
      const baseUrl = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';
      const scraperUrl = `${baseUrl}/scrape`;
      
      console.log('Calling scraper at:', scraperUrl);
      
      const response = await fetch(scraperUrl, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Scraper result:', result);
        
        // Refresh articles list
        const data = await articleService.getAll();
        setArticles(data);
        alert('✓ New article added successfully!');
      } else {
        const errorText = await response.text();
        console.error('Scraper error:', errorText);
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
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper to clean HTML from content
  const cleanContent = (html) => {
    // Create a temporary div to decode HTML entities and strip tags
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm font-light">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-6 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-2xl hover:shadow-lg hover:shadow-violet-500/50 transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-cyan-200 mb-6">
              BeyondChats
            </h1>
            <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto font-light leading-relaxed">
              AI-enhanced articles with enriched content and curated references from the world's best sources
            </p>
            
            {/* Decorative line */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-violet-500"></div>
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-500"></div>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-20 sm:py-32">
        {/* AI-Enhanced Articles Section */}
        {enhancedArticles.length > 0 && (
          <section className="mb-32">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold rounded-full tracking-wider uppercase">
                  AI Enhanced
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-violet-500/50 to-transparent"></div>
              </div>
              <h2 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
                Enhanced Articles
              </h2>
              <p className="text-xl text-white/50 font-light max-w-2xl">
                Rewritten by AI using top Google search results as references
              </p>
            </motion.div>

            {/* Bento Grid Layout - Asymmetric Design */}
            <div className="grid grid-cols-12 gap-6 auto-rows-auto">
              {enhancedArticles.map((article, index) => {
                // Create unique layouts for each card position
                const layouts = [
                  'col-span-12 lg:col-span-7 row-span-2', // Large featured
                  'col-span-12 lg:col-span-5 row-span-1', // Medium right
                  'col-span-12 lg:col-span-5 row-span-1', // Medium left
                ];
                const layout = layouts[index % layouts.length];
                const isFeatured = index % 3 === 0;
                
                return (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 + 0.3, duration: 0.7 }}
                    className={`group ${layout}`}
                  >
                    <Link to={`/article/${article.id}`} className="block h-full">
                      <div className="glass glow-violet h-full rounded-[2rem] p-10 hover:bg-white/[0.08] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-violet-500/30 relative overflow-hidden">
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        
                        <div className="relative z-10">
                          {/* Badge and Date Row */}
                          <div className="flex items-center justify-between mb-6">
                            <time className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em]">
                              {formatDate(article.published_at)}
                            </time>
                            <span className="px-4 py-1.5 bg-gradient-to-r from-violet-600/80 to-purple-600/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-full tracking-wider uppercase">
                              ✨ AI Enhanced
                            </span>
                          </div>

                          <h3 className={`${
                            isFeatured 
                              ? 'text-4xl sm:text-5xl lg:text-6xl' 
                              : 'text-2xl sm:text-3xl lg:text-4xl'
                          } font-bold text-white mb-6 leading-[1.1] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:via-fuchsia-300 group-hover:to-cyan-300 transition-all duration-500`}>
                            {cleanContent(article.title)}
                          </h3>

                          <p className={`${
                            isFeatured 
                              ? 'text-lg line-clamp-4' 
                              : 'text-base line-clamp-3'
                          } text-white/60 leading-relaxed mb-8 font-light`}>
                            {cleanContent(article.content).substring(0, isFeatured ? 250 : 160)}...
                          </p>

                          {/* Footer with hover arrow */}
                          <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">Read More</span>
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-all duration-500">
                              <svg className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}

        {/* Original Articles Section */}
        {originalArticles.length > 0 && (
          <section>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-16"
            >
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold rounded-full tracking-wider uppercase">
                      Original
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                  </div>
                  <h2 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
                    {originalArticles.length} Classic Articles
                  </h2>
                  <p className="text-xl text-white/50 font-light">
                    Original articles from BeyondChats blog archive
                  </p>
                </div>
                
                <button
                  onClick={handleAddMoreArticle}
                  disabled={scraping}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium group"
                >
                  {scraping ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scraping...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Article
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Magazine-style Grid Layout */}
            <div className="grid grid-cols-12 gap-6">
              {originalArticles.map((article, index) => {
                // Alternating layout pattern
                const isEven = index % 2 === 0;
                const colSpan = isEven ? 'col-span-12 lg:col-span-7' : 'col-span-12 lg:col-span-5';
                
                return (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 + 0.5, duration: 0.7 }}
                    className={`group ${colSpan}`}
                  >
                    <div className="glass glow-cyan h-full rounded-[2rem] p-10 hover:bg-white/[0.08] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/30 relative overflow-hidden group">
                      {/* Animated border gradient */}
                      <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20"></div>
                      </div>
                      
                      <div className="relative z-10">
                        {/* Header with number */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <time className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em] block mb-2">
                              {formatDate(article.published_at)}
                            </time>
                            <span className="inline-block px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold rounded-full tracking-wider uppercase">
                              Classic
                            </span>
                          </div>
                          <div className="text-7xl font-black text-white/5 leading-none">
                            {(index + 1).toString().padStart(2, '0')}
                          </div>
                        </div>

                        <h3 className={`${
                          isEven 
                            ? 'text-3xl sm:text-4xl lg:text-5xl' 
                            : 'text-2xl sm:text-3xl'
                        } font-bold text-white mb-6 leading-[1.15] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-blue-300 transition-all duration-500`}>
                          {cleanContent(article.title)}
                        </h3>

                        <p className="text-base text-white/60 line-clamp-3 leading-relaxed mb-8 font-light">
                          {cleanContent(article.content).substring(0, 160)}...
                        </p>

                        {/* Interactive footer */}
                        <Link 
                          to={`/article/${article.id}`}
                          className="flex items-center justify-between pt-4 border-t border-white/10 group/link"
                        >
                          <span className="text-white/50 text-xs uppercase tracking-widest font-semibold group-hover/link:text-cyan-400 transition-colors duration-300">
                            Explore Article
                          </span>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/link:bg-cyan-500/20 transition-all duration-500">
                            <svg className="w-4 h-4 text-white/60 group-hover/link:text-cyan-400 group-hover/link:translate-x-1 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <div className="text-center py-32">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white/40 text-xl font-light">No articles found</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-white/40 text-sm font-light">
              © 2025 BeyondChats. Powered by AI enrichment.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-white/40 text-sm">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

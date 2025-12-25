import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { articleService } from '../services/api';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);
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

  // Function to trigger Laravel scraper
  const handleAddMoreArticle = async () => {
    setScraping(true);
    try {
      const baseUrl = import.meta.env.VITE_LARAVEL_API_URL || 'http://beyondchatsbackend.test/api';
      const response = await fetch(`${baseUrl}/scrape`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await articleService.getAll();
        setArticles(data);
      }
    } catch (err) {
      console.error('Scraping error:', err);
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

  const cleanContent = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-white/30 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-white/40 text-sm tracking-wide">Loading articles...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white/60 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all duration-300"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient gradient blurs */}
      <div className="gradient-blur gradient-blur-1" />
      <div className="gradient-blur gradient-blur-2" />

      {/* Demo Mode Banner */}
      {isDemo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3">
            <p className="text-center text-amber-400/90 text-sm font-medium">
              ✨ Demo Mode — Showing sample articles while backend is offline
            </p>
          </div>
        </motion.div>
      )}

      {/* Hero Header */}
      <header className="relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Beyond
              <span className="bg-gradient-to-r from-white via-white/80 to-white/60 bg-clip-text text-transparent">Chats</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-xl">
              Discover AI-enhanced articles with curated references from across the web. 
              Intelligent content, beautifully presented.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-32">
        {/* AI-Enhanced Articles Section */}
        {enhancedArticles.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-24"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Enhanced</h2>
                  <p className="text-sm text-white/40">AI-improved with references</p>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-6">
              {enhancedArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  variants={itemVariants}
                  className="group"
                >
                  <Link to={`/article/${article.id}`}>
                    <div className="relative glass rounded-3xl p-10 lg:p-12 card-hover overflow-hidden">
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shine-effect transition-opacity duration-500" />
                      
                      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                              Enhanced
                            </span>
                            <time className="text-xs text-white/30 font-medium">
                              {formatDate(article.published_at)}
                            </time>
                          </div>

                          <h3 className="text-2xl lg:text-3xl font-semibold text-white mb-4 group-hover:text-white/90 transition-colors leading-tight">
                            {cleanContent(article.title)}
                          </h3>

                          <p className="text-white/40 text-base leading-relaxed line-clamp-2">
                            {cleanContent(article.content).substring(0, 180)}...
                          </p>
                        </div>

                        <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-300">
                            <svg className="w-5 h-5 text-white/60 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {/* Original Articles Section */}
        {originalArticles.length > 0 && (
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Original Articles</h2>
                  <p className="text-sm text-white/40">{originalArticles.length} articles from BeyondChats</p>
                </div>
              </div>

              {!isDemo && (
                <button
                  onClick={handleAddMoreArticle}
                  disabled={scraping}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scraping ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
              )}
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {originalArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  variants={itemVariants}
                  className="group"
                >
                  <Link to={`/article/${article.id}`}>
                    <div className="relative h-full glass rounded-2xl p-6 lg:p-8 card-hover overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shine-effect transition-opacity duration-500" />
                      
                      <div className="relative h-full flex flex-col">
                        <time className="text-xs text-white/30 font-medium mb-4">
                          {formatDate(article.published_at)}
                        </time>

                        <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-white/90 transition-colors leading-snug flex-grow">
                          {cleanContent(article.title)}
                        </h3>

                        <p className="text-white/40 text-sm leading-relaxed line-clamp-3 mb-6">
                          {cleanContent(article.content).substring(0, 120)}...
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <span className="text-xs text-white/30 font-medium">Read article</span>
                          <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {articles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-white/40 text-lg">No articles found</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              © 2025 BeyondChats. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com/Yashu9844/BeyondChats-assignment" target="_blank" rel="noopener noreferrer" className="text-sm text-white/30 hover:text-white/60 transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

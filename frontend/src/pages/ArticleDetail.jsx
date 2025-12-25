import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { articleService } from '../services/api';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        const data = await articleService.getById(parseInt(id));
        setArticle(data);
        setIsDemo(articleService.isUsingMockData());
      } catch (err) {
        setError('Failed to load article. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to clean HTML and decode entities
  const cleanHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Extract references from content
  const extractReferences = (content) => {
    const refIndex = content.indexOf('---\n\nReferences:');
    if (refIndex === -1) return { mainContent: content, references: [] };

    const mainContent = content.substring(0, refIndex).trim();
    const refSection = content.substring(refIndex);
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const references = refSection.match(urlRegex) || [];

    return { mainContent, references };
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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-zinc-400 mb-6">{error || 'Article not found'}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg hover:bg-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { mainContent, references } = extractReferences(article.content);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Demo Mode:</strong> Viewing sample article data.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800/50 sticky top-0 bg-[#09090b]/80 backdrop-blur-xl z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Meta */}
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <time className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                {formatDate(article.published_at)}
              </time>
              {references.length > 0 && (
                <span className="px-2.5 py-1 bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs font-medium rounded-md">
                  AI Enhanced
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-50 mb-12 leading-tight tracking-tight">
            {cleanHTML(article.title)}
          </h1>

          {/* Enhanced Content */}
          <div className="prose prose-lg max-w-none">
            {mainContent.split('\n').map((line, index) => {
              const trimmed = line.trim();
              
              // Headings
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-semibold text-zinc-50 mt-12 mb-4">
                    {trimmed.substring(3)}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-3xl font-semibold text-zinc-50 mt-12 mb-4">
                    {trimmed.substring(2)}
                  </h1>
                );
              }
              
              // Bullet list item
              if (trimmed.startsWith('- **')) {
                const match = trimmed.match(/- \*\*(.+?)\*\*:?(.*)/);
                if (match) {
                  return (
                    <div key={index} className="flex gap-3 mb-4">
                      <span className="text-zinc-500 mt-1">•</span>
                      <div>
                        <strong className="font-semibold text-zinc-100">{match[1]}</strong>
                        <span className="text-zinc-400">{match[2]}</span>
                      </div>
                    </div>
                  );
                }
              }
              
              // Regular paragraph
              if (trimmed && !trimmed.startsWith('##') && !trimmed.startsWith('#')) {
                return (
                  <p key={index} className="text-base leading-relaxed text-zinc-300 mb-6">
                    {trimmed}
                  </p>
                );
              }
              
              return null;
            })}
          </div>

          {/* References Section */}
          {references.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-16 pt-12 border-t border-zinc-800/50"
            >
              <h3 className="text-xl font-semibold text-zinc-50 mb-6">References</h3>
              <div className="space-y-3">
                {references.map((ref, index) => (
                  <a
                    key={index}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-900/20 transition-all duration-200">
                      <span className="text-sm font-medium text-zinc-500 shrink-0 w-6">
                        {index + 1}
                      </span>
                      <span className="text-sm text-zinc-400 group-hover:text-zinc-300 break-all flex-1 transition-colors">
                        {ref}
                      </span>
                      <svg
                        className="w-4 h-4 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Original Content Toggle */}
          <div className="mt-16 pt-12 border-t border-zinc-800/50">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center justify-between w-full text-left group"
            >
              <h3 className="text-lg font-semibold text-zinc-50 group-hover:text-zinc-200 transition-colors">
                View Original Article
              </h3>
              <motion.svg
                animate={{ rotate: showOriginal ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-5 h-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            </button>

            <AnimatePresence>
              {showOriginal && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 p-6 rounded-lg border border-zinc-800/50 bg-zinc-900/20">
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors mb-4 inline-flex items-center gap-2"
                    >
                      Source
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <div className="text-zinc-400 text-sm leading-relaxed space-y-4 mt-4">
                      {cleanHTML(article.content).split('\n\n').map((para, idx) => (
                        para.trim() && <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </article>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <p className="text-xs text-zinc-500">
            © 2025 BeyondChats
          </p>
        </div>
      </footer>
    </div>
  );
}

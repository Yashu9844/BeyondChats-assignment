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
      month: 'long',
      day: 'numeric',
    });
  };

  const cleanHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

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
          <p className="text-white/40 text-sm tracking-wide">Loading article...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white/60 mb-8">{error || 'Article not found'}</p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-all duration-300"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const { mainContent, references } = extractReferences(article.content);
  const isEnhanced = references.length > 0;

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
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-3">
            <p className="text-center text-amber-400/90 text-sm font-medium">
              ✨ Demo Mode — Viewing sample article
            </p>
          </div>
        </motion.div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to articles
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <time className="text-sm text-white/40 font-medium">
              {formatDate(article.published_at)}
            </time>
            {isEnhanced && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400 text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Enhanced
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-12 text-balance">
            {cleanHTML(article.title)}
          </h1>

          {/* Main Content */}
          <div className="prose prose-lg prose-invert max-w-none">
            {mainContent.split('\n').map((line, index) => {
              const trimmed = line.trim();
              
              // Skip empty lines
              if (!trimmed) return null;

              // H2 Headers
              if (trimmed.startsWith('## ')) {
                return (
                  <motion.h2
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * Math.min(index, 5) }}
                    className="text-2xl lg:text-3xl font-semibold text-white mt-16 mb-6 tracking-tight"
                  >
                    {trimmed.substring(3)}
                  </motion.h2>
                );
              }

              // H1 Headers
              if (trimmed.startsWith('# ')) {
                return (
                  <motion.h1
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl lg:text-4xl font-bold text-white mt-16 mb-6 tracking-tight"
                  >
                    {trimmed.substring(2)}
                  </motion.h1>
                );
              }
              
              // Bold bullet points
              if (trimmed.startsWith('- **')) {
                const match = trimmed.match(/- \*\*(.+?)\*\*:?(.*)/);
                if (match) {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * Math.min(index, 10) }}
                      className="flex gap-4 mb-4 group"
                    >
                      <span className="w-2 h-2 mt-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-white">{match[1]}</span>
                        <span className="text-white/60">{match[2]}</span>
                      </div>
                    </motion.div>
                  );
                }
              }

              // Regular bullet points
              if (trimmed.startsWith('- ')) {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 mb-3"
                  >
                    <span className="w-1.5 h-1.5 mt-3 rounded-full bg-white/30 shrink-0" />
                    <span className="text-white/60 leading-relaxed">{trimmed.substring(2)}</span>
                  </motion.div>
                );
              }

              // Numbered lists
              if (/^\d+\.\s/.test(trimmed)) {
                const num = trimmed.match(/^(\d+)\./)[1];
                const text = trimmed.replace(/^\d+\.\s*/, '');
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 mb-4"
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium text-white/60 shrink-0">
                      {num}
                    </span>
                    <span className="text-white/60 leading-relaxed pt-1">{text}</span>
                  </motion.div>
                );
              }
              
              // Regular paragraphs
              return (
                <motion.p
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.02 * Math.min(index, 20) }}
                  className="text-lg text-white/60 leading-relaxed mb-6"
                >
                  {trimmed}
                </motion.p>
              );
            })}
          </div>

          {/* References Section */}
          {references.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-20 pt-12 border-t border-white/10"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">References</h3>
                  <p className="text-sm text-white/40">Sources used for enhancement</p>
                </div>
              </div>

              <div className="space-y-3">
                {references.map((ref, index) => (
                  <motion.a
                    key={index}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="block group"
                  >
                    <div className="glass rounded-xl p-5 card-hover">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium text-white/40 shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/60 text-sm break-all group-hover:text-white/80 transition-colors">
                            {ref}
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-white/20 group-hover:text-white/60 shrink-0 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {/* View Original Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 pt-12 border-t border-white/10"
          >
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full glass rounded-xl p-6 text-left group hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white group-hover:text-white/90 transition-colors">
                      View Original Content
                    </h3>
                    <p className="text-sm text-white/40">See the source article</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: showOriginal ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
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
                  <div className="mt-4 glass rounded-xl p-8">
                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-6"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View source article
                      </a>
                    )}
                    <div className="text-white/50 text-base leading-relaxed space-y-4">
                      {cleanHTML(article.content).split('\n\n').map((para, idx) => (
                        para.trim() && <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </article>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">
              © 2025 BeyondChats. All rights reserved.
            </p>
            <Link to="/" className="text-sm text-white/30 hover:text-white/60 transition-colors">
              ← Back to all articles
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

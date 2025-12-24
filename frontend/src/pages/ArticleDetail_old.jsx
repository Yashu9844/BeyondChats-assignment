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

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        const data = await articleService.getById(parseInt(id));
        setArticle(data);
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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm font-light">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-6 text-lg">{error || 'Article not found'}</p>
          <Link
            to="/"
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-2xl hover:shadow-lg hover:shadow-violet-500/50 transition-all duration-300 inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { mainContent, references } = extractReferences(article.content);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/5 sticky top-0 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 py-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-white/60 hover:text-white transition-colors group"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to articles
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <article className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Meta */}
          <div className="mb-12 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <time className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em]">
                {formatDate(article.published_at)}
              </time>
              {references.length > 0 && (
                <span className="px-4 py-1.5 bg-gradient-to-r from-violet-600/80 to-purple-600/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-full tracking-wider uppercase">
                  ✨ AI Enhanced
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{Math.ceil(cleanHTML(article.content).split(' ').length / 200)} min read</span>
            </div>
          </div>

          {/* Title - Extra large and bold */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-white mb-8 leading-[0.95]">
            {cleanHTML(article.title)}
          </h1>
          
          {/* Decorative divider */}
          <div className="flex items-center gap-4 mb-16">
            <div className="h-1 w-20 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"></div>
            <div className="h-1 w-12 bg-gradient-to-r from-violet-500/50 to-cyan-500/50 rounded-full"></div>
            <div className="h-1 w-6 bg-gradient-to-r from-violet-500/30 to-cyan-500/30 rounded-full"></div>
          </div>

          {/* Enhanced Content - Two column layout for readability */}
          <div className="prose prose-xl max-w-none article-content">
            {mainContent.split('\n').map((line, index) => {
              const trimmed = line.trim();
              
              // Headings - Large and dramatic
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-4xl sm:text-5xl font-black text-white mt-20 mb-8 leading-tight">
                    <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      {trimmed.substring(3)}
                    </span>
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-5xl sm:text-6xl font-black text-white mt-20 mb-8 leading-tight">
                    {trimmed.substring(2)}
                  </h1>
                );
              }
              
              // Bullet list item - Styled with custom bullets
              if (trimmed.startsWith('- **')) {
                const match = trimmed.match(/- \*\*(.+?)\*\*:?(.*)/);
                if (match) {
                  return (
                    <div key={index} className="flex gap-4 mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                      </div>
                      <div className="flex-1">
                        <strong className="font-bold text-white text-lg block mb-1">{match[1]}</strong>
                        <span className="text-white/60 leading-relaxed">{match[2]}</span>
                      </div>
                    </div>
                  );
                }
              }
              
              // Regular paragraph - Large, readable text
              if (trimmed && !trimmed.startsWith('##') && !trimmed.startsWith('#')) {
                return (
                  <p key={index} className="text-xl leading-[1.8] text-white/75 mb-8 font-light">
                    {trimmed}
                  </p>
                );
              }
              
              return null;
            })}
          </div>

          {/* References Section - Magazine style */}
          {references.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-24 pt-16 border-t-2 border-white/10"
            >
              <div className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                  <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-600/80 to-blue-600/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-full tracking-wider uppercase">
                    Sources
                  </span>
                </div>
                <h3 className="text-4xl sm:text-5xl font-black text-white mb-2">
                  References
                </h3>
                <p className="text-white/50 text-lg font-light">Curated sources that enhanced this article</p>
              </div>
              
              <div className="grid gap-4">
                {references.map((ref, index) => (
                  <a
                    key={index}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="glass glow-cyan flex items-start gap-6 p-6 rounded-[1.5rem] hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden">
                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative z-10 flex items-start gap-6 flex-1">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                            <span className="text-cyan-300 text-lg font-black">{index + 1}</span>
                          </div>
                          <div className="w-px h-full bg-gradient-to-b from-cyan-500/30 to-transparent"></div>
                        </div>
                        
                        <div className="flex-1 pt-1">
                          <span className="text-base text-white/70 group-hover:text-white break-all font-light leading-relaxed transition-colors duration-300">
                            {ref}
                          </span>
                        </div>
                        
                        <div className="shrink-0">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all duration-500">
                            <svg
                              className="w-5 h-5 text-white/40 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
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
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Original Content Toggle */}
          <div className="mt-24 pt-16 border-t-2 border-white/10">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="flex items-center justify-between w-full text-left group p-6 rounded-[1.5rem] hover:bg-white/[0.02] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-300">
                  <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-xs text-white/40 uppercase tracking-wider font-bold mb-1">Archive</span>
                  <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-300">
                    View Original Article
                  </h3>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showOriginal ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {showOriginal && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-8 glass rounded-[2rem] p-10 border border-white/10">
                    <div className="mb-8 pb-6 border-b border-white/10">
                      <span className="text-xs text-white/40 uppercase tracking-wider font-bold block mb-3">Original Source</span>
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-white/60 hover:text-cyan-400 transition-colors inline-flex items-center gap-3 group"
                      >
                        <span className="break-all">{article.source_url}</span>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-all duration-300">
                          <svg className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </a>
                    </div>
                    <div className="text-white/70 font-light leading-[1.8] space-y-6">
                      {cleanHTML(article.content).split('\n\n').map((para, idx) => (
                        para.trim() && <p key={idx} className="text-lg leading-[1.8]">{para}</p>
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
      <footer className="relative z-10 border-t border-white/5 backdrop-blur-xl mt-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 py-12">
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

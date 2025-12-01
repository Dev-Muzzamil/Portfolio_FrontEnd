import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Calendar, Code, Award, FileText, Image, Play, ChevronDown, X, ArrowUpRight, Download, Link, FolderOpen } from 'lucide-react';
import { getApiBaseUrl } from '../utils/helpers';
import TechnologyIcon from './TechnologyIcon';
import { api } from '../services/api';

const UnifiedModal = ({
  data,
  type,
  mode,
  isOpen,
  onClose,
  linkedItems = [],
  websitePreviews = {},
  className = ''
}) => {
  const [freshProject, setFreshProject] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLatest() {
      if (!isOpen || !data || type !== 'project' || !data._id) return;
      try {
        const res = await api.get(`/projects/${data._id}`);
        if (!cancelled) setFreshProject(res?.data?.project || null);
      } catch (_) {
        if (!cancelled) setFreshProject(null);
      }
    }
    fetchLatest();
    return () => { cancelled = true };
  }, [isOpen, data?._id, type]);

  if (!isOpen || !data) return null;

  const formatLabel = (label, isoDate, precision) => {
    if (label) return label
    if (!isoDate) return null
    try {
      const d = new Date(isoDate)
      if (precision === 'year') return String(d.getFullYear())
      if (precision === 'month') return d.toLocaleString(undefined, { month: 'short', year: 'numeric' })
      return d.toLocaleDateString()
    } catch (_) { return null }
  }

  const dateRangeLabel = (() => {
    const p = freshProject || data
    if (!p) return null
    const s = formatLabel(p.startLabel, p.startDate, p.startPrecision)
    const e = formatLabel(p.endLabel, p.endDate, p.endPrecision)
    if (!s && !e) return null
    if (s && e) return `${s} — ${e}`
    return s || e
  })()

  const getImageSource = () => {
    if (type === 'project') {
      const preview = websitePreviews[data._id];
      const shots = (freshProject && freshProject.screenshots) || data.screenshots;
      if (shots && shots.length > 0) return { type: 'custom', url: shots[0], alt: data.title };
      if (preview && preview.url) return { type: 'screenshot', url: preview.url, alt: data.title };
      if (data.liveUrl) {
        const apiBase = getApiBaseUrl();
        const screenshotUrl = `${apiBase}/api/v1/public/screenshot?url=${encodeURIComponent(data.liveUrl)}&projectId=${data._id}`;
        return { type: 'screenshot', url: screenshotUrl, alt: data.title };
      }
      return { type: 'fallback', url: null, alt: 'No preview' };
    } else if (type === 'certificate') {
      if (data.certificateFile?.previewUrl || data.certificateFile?.originalUrl) return { type: 'image', url: data.certificateFile.previewUrl || data.certificateFile.originalUrl, alt: data.title };
      if (data.certificateUrl) return { type: 'image', url: data.certificateUrl, alt: data.title };
      return { type: 'fallback', url: null, alt: 'No preview' };
    } else if (type === 'github') {
      return { type: 'avatar', url: data.owner?.avatar_url || data.avatar_url, alt: data.name };
    }
    return { type: 'fallback', url: null, alt: 'No preview' };
  };

  const getTechnologies = () => {
    if (type === 'project') return data.technologies || [];
    if (type === 'certificate') return (data.skills || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean);
    return data.language ? [data.language] : [];
  };

  const imageSource = getImageSource();
  const technologies = getTechnologies();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-ink/90 dark:bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`relative bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-[95vw] max-w-6xl h-[90vh] shadow-2xl dark:shadow-strong-dark border border-white/50 dark:border-white/10 overflow-hidden flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-50 p-3 bg-paper dark:bg-surface-dark text-ink dark:text-ink-dark hover:bg-accent dark:hover:bg-accent-dark hover:text-paper dark:hover:text-paper-dark transition-colors rounded-full shadow-lg border border-ink/5 dark:border-ink-dark/10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="overflow-y-auto h-full" ref={scrollRef}>
              {/* Image Section */}
              <div className="relative h-[60vh] min-h-[400px] bg-gray/5 dark:bg-white/5">
                {imageSource.url ? (
                  <img
                    src={imageSource.url}
                    alt={imageSource.alt}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-20 grayscale">
                      {type === 'project' ? '💻' : '🏆'}
                    </span>
                  </div>
                )}

                {/* Overlay Links - Show ALL GitHub and Live URLs */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-ink/90 to-transparent flex flex-wrap justify-center gap-4 pt-20">
                  {/* Show all live URLs */}
                  {type === 'project' && (data.liveUrls?.length > 0 ? data.liveUrls : (data.liveUrl ? [data.liveUrl] : [])).map((url, idx) => (
                    <a
                      key={`live-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark rounded-full hover:bg-accent dark:hover:bg-accent-dark hover:text-paper dark:hover:text-paper-dark transition-all duration-300 text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>{data.liveUrls?.length > 1 ? `Demo ${idx + 1}` : 'Live Demo'}</span>
                    </a>
                  ))}
                  {/* Show all GitHub URLs */}
                  {type === 'project' && (data.githubUrls?.length > 0 ? data.githubUrls : (data.githubUrl ? [data.githubUrl] : [])).map((url, idx) => (
                    <a
                      key={`github-${idx}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-ink/50 backdrop-blur-md text-paper border border-paper/20 rounded-full hover:bg-ink transition-all duration-300 text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105"
                    >
                      <Github className="w-4 h-4" />
                      <span>{(data.githubUrls?.length > 1 || (data.githubUrl && data.githubUrls?.length > 0)) ? `Repo ${idx + 1}` : 'GitHub'}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-12 max-w-4xl mx-auto space-y-12 pb-24">
                {/* Header */}
                <div className="text-center space-y-4">
                  <h2 className="font-serif text-5xl md:text-6xl text-ink dark:text-ink-dark leading-tight">
                    {data.title || data.name}
                  </h2>
                  <div className="flex flex-wrap justify-center gap-3">
                    {data.category && (
                      <span className="px-4 py-1 bg-gray/10 dark:bg-white/10 text-ink/60 dark:text-ink-dark/60 rounded-full text-xs font-bold uppercase tracking-widest">
                        {data.category}
                      </span>
                    )}
                    {data.status && (
                      <span className="px-4 py-1 bg-gray/10 dark:bg-white/10 text-ink/60 dark:text-ink-dark/60 rounded-full text-xs font-bold uppercase tracking-widest">
                        {data.status}
                      </span>
                    )}
                    {dateRangeLabel && (
                      <span className="px-4 py-1 bg-gray/10 dark:bg-white/10 text-ink/60 dark:text-ink-dark/60 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {dateRangeLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="font-serif text-xl text-ink/80 dark:text-ink-dark/80 leading-relaxed text-center">
                  {data.description}
                </div>

                {/* Technologies */}
                {technologies.length > 0 && (
                  <div className="text-center">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-accent dark:text-accent-dark mb-6">Technologies</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {technologies.map((tech, i) => (
                        <span key={i} className="px-4 py-2 bg-paper dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 rounded-full text-xs font-sans font-medium text-ink/70 dark:text-ink-dark/70 uppercase tracking-wider flex items-center gap-2">
                          {type === 'project' && <TechnologyIcon technology={tech} className="w-4 h-4 grayscale opacity-50" />}
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Institution */}
                {data.completedAtInstitution && (
                  <div className="text-center border-t border-ink/10 dark:border-ink-dark/10 pt-8">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-gray dark:text-gray-dark mb-2">Completed At</h3>
                    <p className="font-serif text-2xl text-ink dark:text-ink-dark">{data.completedAtInstitution}</p>
                  </div>
                )}

                {/* Links & Resources Section - Dedicated section for all URLs */}
                {type === 'project' && (
                  ((data.githubUrls?.length > 0 || data.githubUrl) || 
                   (data.liveUrls?.length > 0 || data.liveUrl) ||
                   (freshProject?.files || data.files)?.length > 0) && (
                  <div className="border-t border-ink/10 dark:border-ink-dark/10 pt-8">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-accent dark:text-accent-dark mb-6 text-center flex items-center justify-center gap-2">
                      <Link className="w-4 h-4" />
                      Links & Resources
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Live URLs */}
                      {(data.liveUrls?.length > 0 || data.liveUrl) && (
                        <div>
                          <h4 className="text-xs font-semibold text-ink/60 dark:text-ink-dark/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <ExternalLink className="w-3 h-3" />
                            Live Demos
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(data.liveUrls?.length > 0 ? data.liveUrls : (data.liveUrl ? [data.liveUrl] : [])).map((url, idx) => (
                              <motion.a
                                key={`live-link-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 p-3 bg-paper dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 rounded-lg hover:shadow-md dark:hover:shadow-medium-dark hover:border-accent/30 dark:hover:border-accent-dark/30 transition-all group"
                              >
                                <div className="p-2 bg-accent/10 dark:bg-accent-dark/10 rounded-lg group-hover:bg-accent dark:group-hover:bg-accent-dark transition-colors">
                                  <ArrowUpRight className="w-4 h-4 text-accent dark:text-accent-dark group-hover:text-paper dark:group-hover:text-paper-dark" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-ink dark:text-ink-dark text-sm group-hover:text-accent dark:group-hover:text-accent-dark transition-colors">
                                    {data.liveUrls?.length > 1 ? `Live Demo ${idx + 1}` : 'Live Demo'}
                                  </p>
                                  <p className="text-xs text-ink/50 dark:text-ink-dark/50 truncate">{url}</p>
                                </div>
                              </motion.a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GitHub URLs */}
                      {(data.githubUrls?.length > 0 || data.githubUrl) && (
                        <div>
                          <h4 className="text-xs font-semibold text-ink/60 dark:text-ink-dark/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Github className="w-3 h-3" />
                            Source Code
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(data.githubUrls?.length > 0 ? data.githubUrls : (data.githubUrl ? [data.githubUrl] : [])).map((url, idx) => {
                              // Extract repo name from URL
                              const repoName = url.split('/').slice(-2).join('/').replace('.git', '');
                              return (
                                <motion.a
                                  key={`github-link-${idx}`}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-center gap-3 p-3 bg-paper dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 rounded-lg hover:shadow-md dark:hover:shadow-medium-dark hover:border-ink/30 dark:hover:border-ink-dark/30 transition-all group"
                                >
                                  <div className="p-2 bg-ink/10 dark:bg-ink-dark/10 rounded-lg group-hover:bg-ink dark:group-hover:bg-ink-dark transition-colors">
                                    <Github className="w-4 h-4 text-ink dark:text-ink-dark group-hover:text-paper dark:group-hover:text-paper-dark" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-ink dark:text-ink-dark text-sm group-hover:text-ink dark:group-hover:text-ink-dark transition-colors">
                                      {(data.githubUrls?.length > 1 || (data.githubUrl && data.githubUrls?.length > 0)) ? `Repository ${idx + 1}` : 'Repository'}
                                    </p>
                                    <p className="text-xs text-ink/50 dark:text-ink-dark/50 truncate">{repoName}</p>
                                  </div>
                                </motion.a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Project Files */}
                      {(freshProject?.files || data.files)?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-ink/60 dark:text-ink-dark/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <FolderOpen className="w-3 h-3" />
                            Project Files
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {((freshProject?.files || data.files) || []).map((file, idx) => (
                              <motion.a
                                key={file._id || idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 p-3 bg-paper dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 rounded-lg hover:shadow-md dark:hover:shadow-medium-dark hover:border-accent/30 dark:hover:border-accent-dark/30 transition-all group"
                              >
                                <FileText className="w-4 h-4 text-ink/50 dark:text-ink-dark/50 group-hover:text-accent dark:group-hover:text-accent-dark flex-shrink-0 transition-colors" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-ink dark:text-ink-dark text-xs truncate group-hover:text-accent dark:group-hover:text-accent-dark transition-colors">
                                    {file.originalName}
                                  </p>
                                  {file.size && (
                                    <p className="text-xs text-ink/40 dark:text-ink-dark/40">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  )}
                                </div>
                                <Download className="w-4 h-4 text-ink/30 dark:text-ink-dark/30 group-hover:text-accent dark:group-hover:text-accent-dark flex-shrink-0 transition-colors" />
                              </motion.a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Reports Section */}
                {type === 'project' && (freshProject?.reports || data.reports)?.length > 0 && (
                  <div className="border-t border-ink/10 dark:border-ink-dark/10 pt-8">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-accent dark:text-accent-dark mb-6 text-center flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      Reports & Documentation
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {((freshProject?.reports || data.reports) || [])
                        .filter(report => report.visible !== false)
                        .map((report, idx) => (
                        <motion.div
                          key={report._id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between p-4 bg-paper dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 rounded-lg hover:shadow-md dark:hover:shadow-medium-dark transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {report.type === 'file' ? (
                              <FileText className="w-5 h-5 text-accent dark:text-accent-dark flex-shrink-0" />
                            ) : (
                              <Link className="w-5 h-5 text-accent dark:text-accent-dark flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-ink dark:text-ink-dark text-sm truncate">{report.title}</p>
                              {report.description && (
                                <p className="text-xs text-ink/50 dark:text-ink-dark/50 truncate">{report.description}</p>
                              )}
                            </div>
                          </div>
                          {report.type === 'file' && report.file?.url && (
                            <a
                              href={report.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark hover:bg-accent dark:hover:bg-accent-dark hover:text-paper dark:hover:text-paper-dark rounded-full transition-colors flex-shrink-0"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {report.type === 'link' && report.link?.url && (
                            <a
                              href={report.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark hover:bg-accent dark:hover:bg-accent-dark hover:text-paper dark:hover:text-paper-dark rounded-full transition-colors flex-shrink-0"
                              title="Open link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificate Reports Section */}
                {type === 'certificate' && (data.reports)?.length > 0 && (
                  <div className="border-t border-ink/10 dark:border-ink-dark/10 pt-8">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-accent dark:text-accent-dark mb-6 text-center flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" />
                      Related Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(data.reports || [])
                        .filter(report => report.visible !== false)
                        .map((report, idx) => (
                        <motion.div
                          key={report._id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center justify-between p-4 bg-paper dark:bg-surface-dark border border-ink/10 dark:border-ink-dark/10 rounded-lg hover:shadow-md dark:hover:shadow-medium-dark transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {report.type === 'file' ? (
                              <FileText className="w-5 h-5 text-accent dark:text-accent-dark flex-shrink-0" />
                            ) : (
                              <Link className="w-5 h-5 text-accent dark:text-accent-dark flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-ink dark:text-ink-dark text-sm truncate">{report.title}</p>
                              {report.description && (
                                <p className="text-xs text-ink/50 dark:text-ink-dark/50 truncate">{report.description}</p>
                              )}
                            </div>
                          </div>
                          {report.type === 'file' && report.file?.url && (
                            <a
                              href={report.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark hover:bg-accent dark:hover:bg-accent-dark hover:text-paper dark:hover:text-paper-dark rounded-full transition-colors flex-shrink-0"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {report.type === 'link' && report.link?.url && (
                            <a
                              href={report.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark hover:bg-accent dark:hover:bg-accent-dark hover:text-paper dark:hover:text-paper-dark rounded-full transition-colors flex-shrink-0"
                              title="Open link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnifiedModal;
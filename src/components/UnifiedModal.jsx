import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Eye, Calendar, Code, Monitor, Award, FileText, Image, Play, Download, ChevronDown } from 'lucide-react';
import { getApiBaseUrl } from '../utils/helpers';
import TechnologyIcon from './TechnologyIcon';
import { api } from '../services/api';

const UnifiedModal = ({
  data,
  type,
  mode,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleVisibility,
  onLink,
  linkedItems = [],
  websitePreviews = {},
  onLoadWebsitePreview,
  className = ''
}) => {
  if (!isOpen || !data) return null;

  const [freshProject, setFreshProject] = useState(null);
  const scrollRef = useRef(null);
  const detailsRef = useRef(null);

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

  // Helper to format a label given stored precision/label/date
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

  // duration label removed per request — we no longer show '2 mos' in the modal timeline

  // Get image source based on type
  const getImageSource = () => {
    if (type === 'project') {
      const preview = websitePreviews[data._id];

      const shots = (freshProject && freshProject.screenshots) || data.screenshots;
      if (shots && shots.length > 0) {
        return {
          type: 'custom',
          url: shots[0],
          alt: data.title
        };
      }

      if (preview && preview.url) {
        return {
          type: 'screenshot',
          url: preview.url,
          alt: `${data.title} website preview`
        };
      }

      if (data.liveUrl) {
        const apiBase = getApiBaseUrl();
        // Use cached public screenshot endpoint (no per-open cache-busting)
        const screenshotUrl = `${apiBase}/api/v1/public/screenshot?url=${encodeURIComponent(data.liveUrl)}&projectId=${data._id}`;
        return {
          type: 'screenshot',
          url: screenshotUrl,
          alt: `${data.title} website preview`
        };
      }

      return {
        type: 'fallback',
        url: null,
        alt: 'No preview available'
      };
    } else if (type === 'certificate') {
      // Certificate logic: Check preview first, then file, then image, then fallback
      
      // Check for preview image from extraction
      if (data.certificateFile?.previewUrl || data.certificateFile?.originalUrl || data.certificateFile?.url) {
        return {
          type: 'image',
          url: data.certificateFile?.previewUrl || data.certificateFile?.originalUrl || data.certificateFile?.url,
          alt: `${data.title} preview`
        };
      }

      // Legacy: Check for primary certificate URL
      if (data.certificateFile?.originalUrl || data.certificateUrl) {
        return {
          type: 'image',
          url: data.certificateFile?.originalUrl || data.certificateUrl,
          alt: `${data.title} certificate`
        };
      }

      // Check files array
      if (data.files && data.files.length > 0) {
        const primaryFile = data.files.find(f => f.isPrimary) || data.files[0];

        if (primaryFile.mimeType?.startsWith('image/')) {
          return {
            type: 'image',
            url: primaryFile.url,
            alt: primaryFile.originalName
          };
        } else if (primaryFile.mimeType?.includes('pdf')) {
          return {
            type: 'pdf',
            url: primaryFile.thumbnailUrl || null,
            alt: primaryFile.originalName,
            file: primaryFile
          };
        }
      }

      // Check image field
      if (data.image?.url) {
        return {
          type: 'image',
          url: data.image.url,
          alt: data.image.alt || data.title
        };
      }

      return {
        type: 'fallback',
        url: null,
        alt: 'No preview available'
      };
    } else if (type === 'github') {
      return {
        type: 'avatar',
        url: data.owner?.avatar_url || data.avatar_url,
        alt: data.name || data.full_name
      };
    }

    return { type: 'fallback', url: null, alt: 'No preview available' };
  };

  // Get technologies/skills
  const getTechnologies = () => {
    if (type === 'project') {
      return data.technologies || [];
    } else if (type === 'certificate') {
      const skills = data.skills || [];
      // Convert skill objects to strings (skills can be either strings or {name, proficiency, verified, _id} objects)
      return skills.map(skill => typeof skill === 'string' ? skill : (skill?.name || '')).filter(Boolean);
    } else if (type === 'github') {
      return data.language ? [data.language] : [];
    }
    return [];
  };

  // Get linked items
  const getLinkedItems = () => {
    if (type === 'project') {
      return data.linkedCertificates?.map(certId =>
        linkedItems.find(cert => cert._id === certId)
      ).filter(Boolean) || [];
    } else if (type === 'certificate') {
      return data.linkedProjects?.map(projectId =>
        linkedItems.find(project => project._id === projectId)
      ).filter(Boolean) || [];
    }
    return [];
  };

  const imageSource = getImageSource();
  const technologies = getTechnologies();
  const linkedItemsList = getLinkedItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl w-[75vw] h-[90vh] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto pb-28" ref={scrollRef} style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
              {/* Image/Preview Section */}
              <div className="relative h-[540px] overflow-hidden">
                {imageSource.type === 'custom' || imageSource.type === 'image' || imageSource.type === 'avatar' ? (
                  <img
                    src={imageSource.url}
                    alt={imageSource.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                    style={{ aspectRatio: '16/9' }}
                  />
                ) : imageSource.type === 'screenshot' ? (
                  <img
                    src={imageSource.url}
                    alt={imageSource.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                    style={{ aspectRatio: '16/9' }}
                  />
                ) : imageSource.type === 'pdf' ? (
                    <div className="relative w-full h-full bg-gradient-to-br from-github-100 to-github-200 dark:from-github-900 dark:to-github-800 flex items-center justify-center overflow-hidden">
                    {imageSource.url ? (
                      <img
                        src={imageSource.url}
                        alt={`${imageSource.alt} thumbnail`}
                        className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                        style={{ aspectRatio: '16/9' }}
                      />
                    ) : null}

                    <div className={`w-full h-full flex items-center justify-center ${imageSource.url ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <FileText className="w-24 h-24 text-github-600 dark:text-github-400 mx-auto mb-4" />
                        <p className="text-lg text-github-700 dark:text-github-300 font-medium px-4">{imageSource.alt}</p>
                        <p className="text-sm text-github-500 dark:text-github-400 mt-2">PDF Document</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-github-100 to-github-200 dark:from-github-900 dark:to-github-800 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">
                        {type === 'project' ? '💻' : type === 'certificate' ? '🏆' : '📁'}
                      </span>
                      <p className="text-github-600 dark:text-github-400 font-medium">No Preview Available</p>
                    </div>
                  </div>
                )}

                {/* Overlay with Links */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-8">
                  <div className="flex flex-wrap gap-4">
                    {/* Project Links (multiple) */}
                    {type === 'project' && ((data.liveUrls && data.liveUrls.length) || data.liveUrl) && (
                      (data.liveUrls && data.liveUrls.length ? data.liveUrls : [data.liveUrl]).map((url, idx) => (
                        <a
                          key={`modal-live-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>{`Live Demo ${idx + 1}`}</span>
                        </a>
                      ))
                    )}
                    {type === 'project' && ((data.githubUrls && data.githubUrls.length) || data.githubUrl) && (
                      (data.githubUrls && data.githubUrls.length ? data.githubUrls : [data.githubUrl]).map((url, idx) => (
                        <a
                          key={`modal-gh-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                          <Github className="w-4 h-4" />
                          <span>{`GitHub ${idx + 1}`}</span>
                        </a>
                      ))
                    )}

                    {/* Certificate Links */}
                    {type === 'certificate' && data.verificationUrl && (
                      <a
                        href={data.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Verify Certificate</span>
                      </a>
                    )}
                    {type === 'certificate' && imageSource.type === 'pdf' && imageSource.file && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (imageSource.file.url) window.open(imageSource.file.url, '_blank');
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                      >
                        <Play className="w-4 h-4" />
                        <span>View Certificate</span>
                      </button>
                    )}

                    {type === 'certificate' && data.files && data.files.some(f => f.mimeType?.includes('pdf')) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const pdfFile = (data.files || []).find(f => f.mimeType?.includes('pdf'));
                          if (pdfFile && pdfFile.url) window.open(pdfFile.url, '_blank');
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Original PDF</span>
                      </button>
                    )}

                    {/* GitHub Repository Link */}
                    {type === 'github' && data.html_url && (
                      <a
                        href={data.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                      >
                        <Github className="w-4 h-4" />
                        <span>View Repository</span>
                      </a>
                    )}
                  </div>

                </div>
              </div>

              {/* Details Section */}
              <div ref={detailsRef} className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">{data.title || data.name || data.full_name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded capitalize text-xs font-medium">
                        {type === 'project' ? data.category : type === 'certificate' ? data.issuingAuthority || data.issuer : data.owner?.login}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        type === 'project'
                          ? data.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : data.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : data.category === 'workshop'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : data.category === 'course'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : data.category === 'certification'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {type === 'project' ? data.status?.replace('-', ' ') : type === 'certificate' ? data.category : data.language || 'Repository'}
                      </span>
                      {/* Date Range: moved below -- shown in dedicated Timeline row */}
                    </div>
                  </div>
                </div>

                {/* Timeline (moved from header): show start/end label only */}
                {type === 'project' && dateRangeLabel && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{dateRangeLabel}</span>
                    </span>
                    {/* Ongoing badge intentionally removed to avoid extra pill */}
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About This {type === 'project' ? 'Project' : type === 'certificate' ? 'Certificate' : 'Repository'}</h3>
                  <div className="text-gray-700 dark:text-gray-300 text-[15px] leading-7">
                    {type === 'project' ? (
                      (() => {
                        const raw = String((data.longDescription || data.description || '')).replace(/\r\n/g, '\n');
                        if (!raw.trim()) return <p className="opacity-75">No description provided.</p>;
                        const hasParagraphs = /\n{2,}/.test(raw);
                        const paragraphs = hasParagraphs
                          ? raw.split(/\n{2,}/).map(s => s.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
                          : [raw.replace(/\s*\n\s*/g, ' ').trim()];
                        return paragraphs.map((p, i) => (
                          <p key={i} className="mb-4 last:mb-0">
                            {p}
                          </p>
                        ));
                      })()
                    ) : type === 'certificate' ? (
                      <p className="mb-0">{data.description}</p>
                    ) : (
                      <p className="mb-0">{data.description || data.bio}</p>
                    )}
                  </div>
                </div>

                {/* Institution Information */}
                {data.completedAtInstitution && (
                    <div className="mb-6">
                    <div className="bg-github-50 dark:bg-github-900/20 border border-github-200 dark:border-github-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-github-100 dark:bg-github-800 rounded-full flex items-center justify-center">
                          <span className="text-github-600 dark:text-github-400 font-semibold text-sm">🏫</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-github-900 dark:text-github-100">Completed at Institution</h4>
                          <p className="text-sm text-github-700 dark:text-github-300">{data.completedAtInstitution}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technologies/Skills */}
                {technologies.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                      <Code className="w-5 h-5" />
                      <span>{type === 'project' ? 'Technologies Used' : type === 'certificate' ? 'Skills & Technologies' : 'Primary Language'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium whitespace-nowrap inline-flex items-center space-x-1"
                        >
                          {type === 'project' && <TechnologyIcon technology={tech} className="w-3 h-3" />}
                          <span>{tech}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Items */}
                {linkedItemsList.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                      {type === 'project' ? <Award className="w-5 h-5" /> : <Code className="w-5 h-5" />}
                      <span>Linked {type === 'project' ? 'Certificates' : 'Projects'}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {linkedItemsList.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                        >
                          {type === 'project' ? <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" /> : <Code className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {type === 'project' ? item.issuingAuthority || item.issuer : item.category}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GitHub Stats */}
                {type === 'github' && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Repository Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.stargazers_count || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Stars</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.forks_count || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Forks</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.watchers_count || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Watchers</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{data.open_issues_count || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Issues</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Links */}
                {type === 'project' && (((data.liveUrls && data.liveUrls.length) || data.liveUrl) || ((data.githubUrls && data.githubUrls.length) || data.githubUrl)) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Project Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(data.liveUrls && data.liveUrls.length ? data.liveUrls : (data.liveUrl ? [data.liveUrl] : [])).map((url, idx) => (
                        <a
                          key={`details-live-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                        >
                          <ExternalLink className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{`Live Demo ${idx + 1}`}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{url}</div>
                          </div>
                        </a>
                      ))}

                      {(data.githubUrls && data.githubUrls.length ? data.githubUrls : (data.githubUrl ? [data.githubUrl] : [])).map((url, idx) => (
                        <a
                          key={`details-gh-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                        >
                          <Github className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{`GitHub Repository ${idx + 1}`}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{url}</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificate Files */}
                {type === 'certificate' && data.files && data.files.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Certificate Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const files = data.files || [];
                        const hasPdf = files.some(f => f.mimeType?.includes('pdf') || (data.certificateFile?.originalUrl && f.url === data.certificateFile?.originalUrl));
                        const visibleFiles = files.filter(f => {
                          // Hide preview image file when an original PDF exists
                          if (hasPdf && data.certificateFile?.previewUrl && f.url === data.certificateFile.previewUrl) return false;
                          return true;
                        });
                        return visibleFiles.map((file, fileIndex) => (
                        <a
                          key={file._id || fileIndex}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                        >
                          {file.mimeType?.startsWith('image/') ? (
                            <Image className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{file.originalName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {file.mimeType} • {((file.size || 0) / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </a>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Global Scroll Down Button (bottom-right of modal) */}
            <button
              onClick={(e) => { e.stopPropagation(); detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="absolute bottom-10 right-5 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-colors duration-200 bg-primary-600 text-white hover:bg-primary-500 ring-2 ring-white/80 dark:ring-black/40"
              title="Scroll down"
              aria-label="Scroll down"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnifiedModal;
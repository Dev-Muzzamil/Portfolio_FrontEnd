import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Eye, ChevronDown, Code, Monitor, Award, FileText, Edit, Trash2, EyeOff } from 'lucide-react';
import { getApiBaseUrl } from '../utils/helpers';
import TechnologyIcon from './TechnologyIcon';

const UnifiedCard = ({
  data,
  type,
  mode,
  onEdit,
  onDelete,
  onToggleVisibility,
  onExpand,
  onLink,
  linkedItems = [],
  className = '',
  config = {},
  activeSkillNames = null,
  // optional height (px string) for equal card sizing in a grid; e.g. '480px'
  targetHeight = null
}) => {
  const [websitePreviews, setWebsitePreviews] = useState({});

  // Configuration for different types and modes
  const defaultConfig = {
      project: {
      home: {
        showActions: false,
        showExpandButton: true,
        showFilter: true,
        // Dynamic height: allow card to grow based on content
        cardHeight: 'h-auto',
        // Increase image height to produce taller, more consistent cards
        // (previous look used larger screenshots; adjust here to match)
        imageHeight: 'h-64 sm:h-72 lg:h-72',
        showStatus: true,
        showTechnologies: true,
        showLinkedItems: true,
        showExternalLinks: true,
        // Preview mode: 'screenshot' | 'iframe' | 'auto'
        // - screenshot: use backend/public screenshots or custom images
        // - iframe: embed liveUrl directly in an iframe (may be blocked by X-Frame-Options/CSP)
        // - auto: iframe for allowed hosts, else fallback to screenshot
        embedMode: (import.meta?.env?.VITE_PROJECT_PREVIEW_MODE || 'screenshot')
      },
      admin: {
        showActions: true,
        showExpandButton: false,
        showFilter: false,
        cardHeight: 'h-auto',
        imageHeight: 'h-48 md:h-56',
        showStatus: true,
        showTechnologies: true,
        showLinkedItems: true,
        showExternalLinks: false
      }
    },
    certificate: {
      home: {
        showActions: false,
        showExpandButton: true,
        showFilter: false,
        cardHeight: 'h-auto',
        imageHeight: 'aspect-[1.414/1] md:aspect-[1.8/1]',
        showStatus: true,
        showTechnologies: true,
        showLinkedItems: true,
        showExternalLinks: true
      },
      admin: {
        showActions: true,
        showExpandButton: false,
        showFilter: false,
        cardHeight: 'h-auto',
        imageHeight: 'aspect-[1.414/1]',
        showStatus: true,
        showTechnologies: true,
        showLinkedItems: true,
        showExternalLinks: false
      }
    },
    github: {
      home: {
        showActions: false,
        showExpandButton: true,
        showFilter: false,
        cardHeight: 'h-auto',
        imageHeight: 'h-44 md:h-48',
        showStatus: true,
        showTechnologies: true,
        showLinkedItems: false,
        showExternalLinks: true
      }
    }
  };

  const currentConfig = { ...defaultConfig[type][mode], ...config };

  // Helper: determine if liveUrl host is allowed for iframe embed
  const isAllowedIframeHost = (url) => {
    try {
      const u = new URL(url);
      const allowEnv = (import.meta?.env?.VITE_IFRAME_ALLOW_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
      // Always allow same-origin embeds (your own deployed domain) when running on the same host
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      if (u.hostname === currentHost) return true;
      if (allowEnv.some(host => host && (u.hostname === host || u.hostname.endsWith('.' + host)))) return true;
      return false;
    } catch (_) {
      return false;
    }
  };

  // Project-specific screenshot loading logic
  const loadWebsitePreview = useCallback(async (itemId, liveUrl) => {
    if (!liveUrl || websitePreviews[itemId]?.url) return;

    try {
      setWebsitePreviews(prev => ({
        ...prev,
        [itemId]: { url: null, loading: true, error: false }
      }));

      const apiBase = getApiBaseUrl();

      // First, check if we have existing screenshots for this project
      try {
        const existingScreenshotsResponse = await fetch(`${apiBase}/api/v1/admin/projects/${itemId}/screenshots`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (existingScreenshotsResponse.ok) {
          const existingScreenshots = await existingScreenshotsResponse.json();

          if (existingScreenshots.length > 0) {
            // Check if the most recent screenshot is less than 12 hours old
            const mostRecent = existingScreenshots[0];
            const screenshotAge = Date.now() - new Date(mostRecent.createdAt).getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            if (screenshotAge < twelveHoursInMs) {
              setWebsitePreviews(prev => ({
                ...prev,
                [itemId]: { url: mostRecent.url, loading: false, error: false }
              }));
              return;
            }
          }
        }
      } catch (existingError) {
        console.log('Could not fetch existing screenshots, will generate new one:', existingError.message);
      }

      // If no stored screenshot, use public endpoint without cache-busting
      const screenshotUrl = `${apiBase}/api/v1/public/screenshot?url=${encodeURIComponent(liveUrl)}&projectId=${itemId}`;

      setWebsitePreviews(prev => ({
        ...prev,
        [itemId]: { url: screenshotUrl, loading: false, error: false }
      }));

    } catch (error) {
      console.error('Error loading website preview:', error);
      setWebsitePreviews(prev => ({
        ...prev,
        [itemId]: { url: null, loading: false, error: true }
      }));
    }
  }, [websitePreviews]);

  // Get image source based on type
  const getImageSource = () => {
    if (type === 'project') {
      // Priority: Custom uploaded image > Website preview state > Live website screenshot > Fallback
      const preview = websitePreviews[data._id];

      if (data.screenshots && data.screenshots.length > 0) {
        return {
          type: 'custom',
          url: data.screenshots[0],
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
        // Optionally embed live website directly in an iframe
        const mode = (currentConfig.embedMode || 'screenshot').toLowerCase();
        const allowIframe = mode === 'iframe' || (mode === 'auto' && isAllowedIframeHost(data.liveUrl));
        if (allowIframe) {
          return {
            type: 'iframe',
            url: data.liveUrl,
            alt: `${data.title} live preview`
          };
        }

        const apiBase = getApiBaseUrl();
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

  // Get status badge
  const getStatusBadge = () => {
    if (type === 'project') {
      // Prefer explicit status if provided
      if (data.status) {
        return {
          text: data.status.replace('-', ' '),
          color: data.status === 'completed'
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : data.status === 'in-progress'
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        };
      }

      // Academic scale badge (mini / major) if category is academic
      if (data.category === 'academic' && data.academicScale) {
        const scaleText = data.academicScale === 'mini' ? 'Mini Academic' : 'Major Academic';
        return {
          text: scaleText,
          color: data.academicScale === 'mini'
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
        };
      }

      // Fallback to category (e.g., Personal / Academic) if present
      if (data.category) {
        const categoryText = (data.category.charAt(0).toUpperCase() + data.category.slice(1)).replace('-', ' ');
        return {
          text: categoryText,
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        };
      }

      // Nothing meaningful to show -> no badge
      return null;
    } else if (type === 'certificate') {
      return {
        text: data.category || 'certificate',
        color: data.category === 'workshop'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
          : data.category === 'course'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : data.category === 'certification'
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      };
    } else if (type === 'github') {
      return {
        text: data.language || 'Repository',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      };
    }
    return null;
  };

  // Get technologies/skills
  const getTechnologies = () => {
    if (type === 'project') {
      const raw = data.technologies || [];
      if (!activeSkillNames) return raw;
      return raw.filter(name => activeSkillNames.has(name));
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
  const statusBadge = getStatusBadge();
  const technologies = getTechnologies();
  const linkedItemsList = getLinkedItems();

  const handleCardClick = () => {
    if (currentConfig.showExpandButton) {
      onExpand?.(data._id || data.id);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action(data._id || data.id);
  };

  const handleToggleVisibilityClick = (e) => {
    e.stopPropagation();
    onToggleVisibility?.(data._id || data.id, !data.visible);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`group cursor-pointer ${type === 'project' ? 'project-card' : ''} ${className}`}
      data-project-id={data?._id}
      style={targetHeight ? { height: targetHeight } : undefined}
      onClick={handleCardClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all duration-300 group-hover:-translate-y-2 ${currentConfig.cardHeight} flex flex-col overflow-hidden ${targetHeight ? 'h-full' : ''}`}
      >
        {/* Band 1: Image / Preview */}
        <div className={`relative overflow-hidden rounded-t-lg ${currentConfig.imageHeight} flex-shrink-0 ${type === 'certificate' ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 p-2' : ''} sm:rounded-t-xl`}> 
          {imageSource.type === 'custom' || imageSource.type === 'image' || imageSource.type === 'avatar' ? (
            <>
              <img
                src={imageSource.url}
                alt={imageSource.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* No preview badge on small card — replaced by Ongoing when project is current */}
            </>
          ) : imageSource.type === 'iframe' ? (
            <div className="relative w-full h-full">
              <iframe
                src={imageSource.url}
                title={imageSource.alt}
                className="w-full h-full rounded-t-lg border-0"
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin allow-scripts"
              />
              {/* No preview badge on small card */}
            </div>
          ) : imageSource.type === 'screenshot' ? (
            <div className="relative">
              <img
                src={imageSource.url}
                alt={imageSource.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* No preview badge on small card */}
            </div>
          ) : imageSource.type === 'pdf' ? (
            <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${type === 'certificate' ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 p-2' : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800'}`}>
              {imageSource.url ? (
                <img
                  src={imageSource.url}
                  alt={`${imageSource.alt} thumbnail`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : null}

              <div className={`w-full h-full flex items-center justify-center ${imageSource.url ? 'hidden' : ''}`}>
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium px-2">{imageSource.alt}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">PDF Document</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${type === 'certificate' ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 p-2' : 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800'}`}>
              <div className="text-center">
                <span className="text-4xl mb-2 block">
                  {type === 'project' ? '💻' : type === 'certificate' ? '🏆' : '📁'}
                </span>
                <p className={`font-medium ${type === 'certificate' ? 'text-gray-600 dark:text-gray-400' : 'text-primary-600 dark:text-primary-400'}`}>No Preview Available</p>
              </div>
            </div>
          )}

          {/* Status / Category / Scale Badge - Top Left (to avoid overlap) */}
          {statusBadge && (
            <div className="absolute top-2 left-2 z-10">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusBadge.color} shadow-lg`}>
                {statusBadge.text}
              </span>
            </div>
          )}

          {/* Overlay with Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-wrap gap-2 justify-center">
              {/* Admin Actions */}
              {currentConfig.showActions && (
                <>
                  <button
                    onClick={(e) => handleActionClick(e, onEdit)}
                    className="p-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-colors duration-200"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, onDelete)}
                    className="p-3 bg-white rounded-full hover:bg-red-600 hover:text-white transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Top-right status chip — only show on projects and when marked ongoing */}
          {type === 'project' && data.isCurrent && (
            <div className="absolute top-2 right-2 z-10">
              <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-md text-xs font-medium">Ongoing</span>
            </div>
          )}

          {/* Expand Indicator */}
          {currentConfig.showExpandButton && (
            <div className="absolute bottom-4 right-4">
              <ChevronDown className="w-5 h-5 text-white bg-black bg-opacity-50 rounded-full p-1" />
            </div>
          )}
        </div>

        {/* Content Section: divide into vertical bands so cards align */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col pb-4 md:pb-6 tv:p-8">
          {/* Band 2: Title and optional subtitle */}
          <div className="mb-2 min-h-[3.25rem] flex flex-col justify-center">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 pr-2 leading-snug line-clamp-2">
              {data.title || data.name || data.full_name}
            </h3>
            {type !== 'project' && (
              <p className="mt-1 text-primary-600 dark:text-primary-400 font-semibold text-xs truncate">
                {type === 'certificate' ? (data.issuingAuthority || data.issuer) : data.owner?.login}
              </p>
            )}
          </div>

          {/* Band 3: Description */}
          <div className="mb-3 min-h-[4.5rem] flex items-start">
            <p className="text-sm text-gray-600 dark:text-gray-400 w-full leading-relaxed line-clamp-4">
              {type === 'project' ? data.description : type === 'certificate' ? data.description : data.description}
            </p>
          </div>

          {/* Band 4: Meta + Technologies + Linked items as a block */}
            <div className="mb-3 flex-1 flex flex-col">
            {/* Divider between description and chips/linked items for clarity */}
            {((currentConfig.showTechnologies && technologies.length > 0) || (currentConfig.showLinkedItems && linkedItemsList.length > 0) || data.completedAtInstitution) && (
              <div className="border-b border-gray-100 dark:border-gray-700 pb-3 mb-3"></div>
            )}

            {/* Institution Information */}
            {data.completedAtInstitution && (
              <div className="mb-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Completed at:</span>
                  <span className="text-gray-700 dark:text-gray-300">{data.completedAtInstitution}</span>
                </div>
              </div>
            )}

            {/* Technologies/Skills */}
            {currentConfig.showTechnologies && technologies.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1.5 w-full">
                  {technologies.filter(Boolean).map((tech, techIndex) => {
                    return (
                      <span
                        key={techIndex}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium whitespace-nowrap inline-flex items-center space-x-1"
                      >
                        {type === 'project' && <TechnologyIcon technology={tech} className="w-3 h-3" />}
                        <span>{tech}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Linked Items */}
            {currentConfig.showLinkedItems && linkedItemsList.length > 0 && (
              <div className="flex items-start">
                <p className="text-sm text-gray-600 dark:text-gray-400 w-full leading-relaxed">
                  {linkedItemsList.filter(Boolean).slice(0, 2).map((item, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap inline-flex items-center space-x-1 ${
                        type === 'project'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}
                    >
                      {type === 'project' ? <Award className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                      <span>{item.title}</span>
                    </span>
                  ))}
                  {linkedItemsList.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-xs font-medium whitespace-nowrap">
                      +{linkedItemsList.length - 2} more
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

            {/* Band 5: Bottom Section (GitHub / Live links or admin actions)
              Always render this band so the bottom border aligns visually
              even when there are no icons/links for a given card. */}
            <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 min-h-[3rem] tv:min-h-[4rem]">
            {/* Admin Mode - Visibility Status and Actions */}
            {currentConfig.showActions ? (
              <>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  data.visible
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {data.visible ? 'Visible' : 'Hidden'}
                </span>

                <div className="flex space-x-1">
                  <button
                    onClick={handleToggleVisibilityClick}
                    className="text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 transition-colors duration-200"
                    title={data.visible ? 'Hide' : 'Show'}
                  >
                    {data.visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, onEdit)}
                    className="text-gray-400 hover:text-primary-600 dark:text-gray-500 dark:hover:text-primary-400 transition-colors duration-200"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, onDelete)}
                    className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              /* Home Mode - External Links */
              <>
                <div className="flex items-center justify-end w-full space-x-2">
                  {/* Project Live URLs (multiple) */}
                  {type === 'project' && ((data.liveUrls && data.liveUrls.length) || data.liveUrl) && (
                    (data.liveUrls && data.liveUrls.length ? data.liveUrls : [data.liveUrl]).map((url, idx) => (
                      <a
                        key={`live-link-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-3 bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200 tv:p-4 tv:text-lg"
                        title={`Live Demo ${idx + 1}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ))
                  )}

                  {/* Project GitHub URLs (multiple) */}
                  {type === 'project' && ((data.githubUrls && data.githubUrls.length) || data.githubUrl) && (
                    (data.githubUrls && data.githubUrls.length ? data.githubUrls : [data.githubUrl]).map((url, idx) => (
                      <a
                        key={`gh-link-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                        title={`GitHub Repo ${idx + 1}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    ))
                  )}

                  {/* Certificate Verification URL */}
                  {type === 'certificate' && data.verificationUrl && (
                    <a
                      href={data.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                      title="Verify Certificate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Certificate PDF View */}
                  {type === 'certificate' && imageSource.type === 'pdf' && imageSource.file && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (imageSource.file.url) {
                          window.open(imageSource.file.url, '_blank');
                        }
                      }}
                      className="p-2 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                      title="View PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}

                  {/* Original PDF View: show when any file in `data.files` is a PDF */}
                  {type === 'certificate' && data.files && data.files.some(f => f.mimeType?.includes('pdf')) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const pdfFile = (data.files || []).find(f => f.mimeType?.includes('pdf'));
                        if (pdfFile && pdfFile.url) {
                          window.open(pdfFile.url, '_blank');
                        }
                      }}
                      className="p-2 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                      title="View Original PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}

                  {/* GitHub Repository Link */}
                  {type === 'github' && data.html_url && (
                    <a
                      href={data.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                      title="View Repository"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UnifiedCard;
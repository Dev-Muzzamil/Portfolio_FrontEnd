import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Github, Eye, ChevronDown, Calendar, Code, Monitor, Award, FileText, Image, Play, Star, Edit, Trash2, EyeOff } from 'lucide-react';
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
  config = {}
}) => {
  const [websitePreviews, setWebsitePreviews] = useState({});
  const [expanded, setExpanded] = useState(false);

  // Configuration for different types and modes
  const defaultConfig = {
    project: {
      home: {
        showActions: false,
        showExpandButton: true,
        showFilter: true,
        cardHeight: 'min-h-[28rem]',
        imageHeight: 'h-56',
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
        imageHeight: 'h-48',
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
        cardHeight: 'min-h-96',
        imageHeight: 'aspect-[1.414/1]',
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
    }
  };

  const currentConfig = { ...defaultConfig[type][mode], ...config };

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
        const existingScreenshotsResponse = await fetch(`${apiBase}/api/projects/screenshots/${itemId}`, {
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

      // If no recent screenshots exist, generate a new one
      const screenshotUrl = `${apiBase}/api/projects/screenshot?url=${encodeURIComponent(liveUrl)}`;

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

  // Auto-load website previews for projects
  useEffect(() => {
    if (type === 'project' && data.liveUrls && data.liveUrls.length > 0) {
      if (!data.images || data.images.length === 0) {
        loadWebsitePreview(data._id, data.liveUrls[0]);
      }
    }
  }, [type, data, loadWebsitePreview]);

  // Get image source based on type
  const getImageSource = () => {
    if (type === 'project') {
      // Priority: Custom uploaded image > Website preview state > Live website screenshot > Fallback
      const preview = websitePreviews[data._id];

      if (data.images && data.images.length > 0) {
        return {
          type: 'custom',
          url: data.images[0].url,
          alt: data.images[0].alt || data.title
        };
      }

      if (preview && preview.url) {
        return {
          type: 'screenshot',
          url: preview.url,
          alt: `${data.title} website preview`
        };
      }

      if (data.liveUrls && data.liveUrls.length > 0) {
        const apiBase = getApiBaseUrl();
        const screenshotUrl = `${apiBase}/api/projects/screenshot?url=${encodeURIComponent(data.liveUrls[0])}&t=${Date.now()}`;
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
      // Certificate logic: Primary file > Image > Fallback
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
    }

    return { type: 'fallback', url: null, alt: 'No preview available' };
  };

  // Get status badge
  const getStatusBadge = () => {
    if (type === 'project') {
      return {
        text: data.status?.replace('-', ' ') || 'Unknown',
        color: data.status === 'completed' 
          ? 'bg-green-100 text-green-700'
          : data.status === 'in-progress'
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-blue-100 text-blue-700'
      };
    } else if (type === 'certificate') {
      return {
        text: data.category || 'certificate',
        color: data.category === 'workshop' 
          ? 'bg-purple-100 text-purple-700'
          : data.category === 'course'
          ? 'bg-blue-100 text-blue-700'
          : data.category === 'certification'
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-700'
      };
    }
    return { text: 'Unknown', color: 'bg-gray-100 text-gray-700' };
  };

  // Get technologies/skills
  const getTechnologies = () => {
    if (type === 'project') {
      return data.technologies || [];
    } else if (type === 'certificate') {
      // Parse skills similar to the original certificate component
      if (!data.skills || !Array.isArray(data.skills)) return [];
      
      return data.skills.map(skill => {
        if (typeof skill === 'string' && skill.startsWith('[')) {
          try {
            const parsed = JSON.parse(skill);
            return Array.isArray(parsed) ? parsed : [skill];
          } catch (e) {
            return [skill];
          }
        }
        return skill;
      }).flat().filter(skill => skill && skill.trim().length > 0);
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
      onExpand?.(data._id);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action(data._id);
  };

  const handleToggleVisibilityClick = (e) => {
    e.stopPropagation();
    onToggleVisibility?.(data._id, !data.visible);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`group cursor-pointer ${className}`}
      onClick={handleCardClick}
      data-project-id={type === 'project' ? data._id : undefined}
      data-certificate-id={type === 'certificate' ? data._id : undefined}
    >
      <div className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 ${currentConfig.cardHeight} flex flex-col overflow-hidden`}>
        {/* Image Section */}
        <div className={`relative overflow-hidden rounded-t-lg ${currentConfig.imageHeight} flex-shrink-0 ${type === 'certificate' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-2' : ''}`}>
          {imageSource.type === 'custom' || imageSource.type === 'image' ? (
            <img
              src={imageSource.url}
              alt={imageSource.alt}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                if (type === 'project' && data.liveUrls && data.liveUrls.length > 0) {
                  loadWebsitePreview(data._id, data.liveUrls[0]);
                }
                e.currentTarget.src = 'data:image/svg+xml;utf8,' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
                  '<rect width="100%" height="100%" fill="%23f3f4f6"/>' +
                  '<text x="50%" y="50%" font-size="20" fill="%23666" dominant-baseline="middle" text-anchor="middle">No image</text>' +
                  '</svg>';
              }}
            />
          ) : imageSource.type === 'screenshot' ? (
            <div className="relative">
              <img
                src={imageSource.url}
                alt={imageSource.alt}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  setWebsitePreviews(prev => ({
                    ...prev,
                    [data._id]: { url: null, loading: false, error: true }
                  }));
                }}
              />
              <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                <Monitor className="w-3 h-3" />
                <span>Live Preview</span>
              </div>
            </div>
          ) : imageSource.type === 'pdf' ? (
            <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${type === 'certificate' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-2' : 'bg-gradient-to-br from-blue-100 to-blue-200'}`}>
              {imageSource.url ? (
                <img
                  src={imageSource.url}
                  alt={`${imageSource.alt} thumbnail`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div className={`w-full h-full flex items-center justify-center ${imageSource.url ? 'hidden' : ''}`}>
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-blue-700 font-medium px-2">{imageSource.alt}</p>
                  <p className="text-xs text-blue-500 mt-1">PDF Document</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${type === 'certificate' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-2' : 'bg-gradient-to-br from-primary-100 to-primary-200'}`}>
              <div className="text-center">
                <span className="text-4xl mb-2 block">
                  {type === 'project' ? '💻' : '🏆'}
                </span>
                <p className={`font-medium ${type === 'certificate' ? 'text-gray-600' : 'text-primary-600'}`}>No Preview Available</p>
              </div>
            </div>
          )}

          {/* Status Badge - Top Right */}
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color} shadow-lg`}>
              {statusBadge.text}
            </span>
          </div>

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

          {/* Expand Indicator */}
          {currentConfig.showExpandButton && (
            <div className="absolute bottom-4 right-4">
              <ChevronDown className="w-5 h-5 text-white bg-black bg-opacity-50 rounded-full p-1" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <div className="h-14 flex items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 flex-1 pr-2 text-justify leading-tight">
              {data.title}
            </h3>
          </div>

          {/* Subtitle */}
          <div className="h-6 flex items-center mb-2">
            <p className="text-primary-600 font-semibold text-sm truncate">
              {type === 'project' ? data.category : data.issuer}
            </p>
          </div>

          {/* Description */}
          <div className="h-16 flex items-start mb-2">
            <p className="text-sm text-gray-600 line-clamp-3 h-full overflow-hidden w-full text-justify leading-relaxed">
              {type === 'project' ? data.shortDescription : data.description}
            </p>
          </div>

          {/* Institution Information */}
          {data.completedAtInstitution && (
            <div className="mb-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span className="font-medium">Completed at:</span>
                <span className="text-gray-700">{data.completedAtInstitution}</span>
              </div>
            </div>
          )}

          {/* Technologies/Skills */}
          {currentConfig.showTechnologies && technologies.length > 0 && (
            <div className="h-12 flex items-start mb-2">
              <div className="flex flex-wrap gap-1 w-full">
                {technologies.slice(0, 4).map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1"
                  >
                    <TechnologyIcon technology={tech} className="w-3 h-3" />
                    <span>{tech}</span>
                  </span>
                ))}
                {technologies.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                    +{technologies.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Linked Items */}
          {currentConfig.showLinkedItems && linkedItemsList.length > 0 && (
            <div className="h-10 flex items-start mb-2">
              <div className="flex flex-wrap gap-1 w-full">
                {linkedItemsList.slice(0, 2).map((item, index) => (
                  <span
                    key={index}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1 ${
                      type === 'project' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {type === 'project' ? <Award className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                    <span>{item.title}</span>
                  </span>
                ))}
                {linkedItemsList.length > 2 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                    +{linkedItemsList.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Reports Section */}
          {data.reports && data.reports.length > 0 && (() => {
            const visibleReports = data.reports.filter(report => report.visible !== false);
            return visibleReports.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
                  <FileText className="w-3 h-3" />
                  <span className="font-medium">Reports:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {visibleReports.slice(0, 3).map((report, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1"
                    >
                      {report.type === 'file' ? (
                        <FileText className="w-3 h-3" />
                      ) : (
                        <ExternalLink className="w-3 h-3" />
                      )}
                      <span className="truncate max-w-20">{report.title}</span>
                    </span>
                  ))}
                  {visibleReports.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                      +{visibleReports.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Bottom Section */}
          <div className="h-12 flex items-center justify-between pt-2 border-t border-gray-100">
            {/* Admin Mode - Visibility Status and Actions */}
            {currentConfig.showActions ? (
              <>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.visible 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {data.visible ? 'Visible' : 'Hidden'}
                </span>
                
                <div className="flex space-x-1">
                  <button
                    onClick={handleToggleVisibilityClick}
                    className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    title={data.visible ? 'Hide' : 'Show'}
                  >
                    {data.visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, onEdit)}
                    className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, onDelete)}
                    className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              /* Home Mode - External Links */
              <>
                <div></div>
                <div className="flex items-center space-x-2">
                  {/* Project Live URLs */}
                  {type === 'project' && data.liveUrls?.map((url, index) => (
                    url && (
                      <a
                        key={`live-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors duration-200"
                        title={`Live Demo ${index + 1}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )
                  ))}
                  
                  {/* Project GitHub URLs */}
                  {type === 'project' && data.githubUrls?.map((url, index) => (
                    url && (
                      <a
                        key={`github-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                        title={`GitHub Repo ${index + 1}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )
                  ))}
                  
                  {/* Certificate Verification URL */}
                  {type === 'certificate' && data.credentialUrl && (
                    <a
                      href={data.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
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
                      className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                      title="View PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
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

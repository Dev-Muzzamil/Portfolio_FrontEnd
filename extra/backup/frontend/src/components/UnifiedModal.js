import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Eye, Calendar, Code, Monitor, Award, FileText, Image, Play, Download, X } from 'lucide-react';
import { getApiBaseUrl } from '../utils/helpers';
import TechnologyIcon from './TechnologyIcon';
import ImprovedPDFViewer from './admin/ImprovedPDFViewer';

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

  // Get image source based on type
  const getImageSource = () => {
    if (type === 'project') {
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

  // Get technologies/skills
  const getTechnologies = () => {
    if (type === 'project') {
      return data.technologies || [];
    } else if (type === 'certificate') {
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
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`bg-white rounded-2xl w-[75vw] h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
              {/* Image/Preview Section */}
              <div className="relative h-[540px] overflow-hidden">
                {imageSource.type === 'custom' || imageSource.type === 'image' ? (
                  <img
                    src={imageSource.url}
                    alt={imageSource.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                    style={{ aspectRatio: '16/9' }}
                    onError={(e) => {
                      if (type === 'project' && data.liveUrls && data.liveUrls.length > 0) {
                        onLoadWebsitePreview?.(data._id, data.liveUrls[0]);
                      }
                      e.currentTarget.src = 'data:image/svg+xml;utf8,' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">' +
                        '<rect width="100%" height="100%" fill="%23f3f4f6"/>' +
                        '<text x="50%" y="50%" font-size="28" fill="%23666" dominant-baseline="middle" text-anchor="middle">No image</text>' +
                        '</svg>';
                    }}
                  />
                ) : imageSource.type === 'screenshot' ? (
                  <img
                    src={imageSource.url}
                    alt={imageSource.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                    style={{ aspectRatio: '16/9' }}
                    onError={(e) => {
                      console.error('Screenshot failed to load');
                    }}
                  />
                ) : imageSource.type === 'pdf' ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                    {imageSource.url ? (
                      <img
                        src={imageSource.url}
                        alt={`${imageSource.alt} thumbnail`}
                        className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                        style={{ aspectRatio: '16/9' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    <div className={`w-full h-full flex items-center justify-center ${imageSource.url ? 'hidden' : ''}`}>
                      <div className="text-center">
                        <FileText className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                        <p className="text-lg text-blue-700 font-medium px-4">{imageSource.alt}</p>
                        <p className="text-sm text-blue-500 mt-2">PDF Document</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">
                        {type === 'project' ? '💻' : '🏆'}
                      </span>
                      <p className="text-primary-600 font-medium">No Preview Available</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay with Links */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-8">
                  <div className="flex flex-wrap gap-4">
                    {/* Project Links */}
                    {type === 'project' && data.liveUrls?.map((url, index) => (
                      url && (
                        <a
                          key={`live-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Live Demo {index + 1}</span>
                        </a>
                      )
                    ))}
                    {type === 'project' && data.githubUrls?.map((url, index) => (
                      url && (
                        <a
                          key={`github-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                          <Github className="w-4 h-4" />
                          <span>GitHub {index + 1}</span>
                        </a>
                      )
                    ))}
                    
                    {/* Certificate Links */}
                    {type === 'certificate' && data.credentialUrl && (
                      <a
                        href={data.credentialUrl}
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
                          // Handle PDF view - this would need to be implemented
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                      >
                        <Play className="w-4 h-4" />
                        <span>View Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{data.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded capitalize text-xs font-medium">
                        {type === 'project' ? data.category : data.issuer}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        type === 'project' 
                          ? data.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : data.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                          : data.category === 'workshop' 
                            ? 'bg-purple-100 text-purple-700'
                            : data.category === 'course'
                            ? 'bg-blue-100 text-blue-700'
                            : data.category === 'certification'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {type === 'project' ? data.status?.replace('-', ' ') : data.category}
                      </span>
                      <span className="flex items-center space-x-1 text-gray-600 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {type === 'project' 
                            ? new Date(data.createdAt).toLocaleDateString()
                            : new Date(data.issueDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long'
                              })
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">About This {type === 'project' ? 'Project' : 'Certificate'}</h3>
                  <div className="text-gray-600 leading-relaxed text-justify text-sm">
                    {type === 'project' ? (
                      (() => {
                        let paragraphs = data.description.split('\n\n').filter(p => p.trim());
                        if (paragraphs.length === 1) {
                          paragraphs = data.description.split('\n').filter(p => p.trim());
                        }
                        if (paragraphs.length === 1) {
                          paragraphs = data.description.split(/\.\s+(?=[A-Z])/).filter(p => p.trim());
                        }
                        return paragraphs.map((paragraph, index) => (
                          <p key={index} className="mb-4 last:mb-0 indent-4 first:indent-0">
                            {paragraph.trim()}{paragraphs.length > 1 && index < paragraphs.length - 1 ? '.' : ''}
                          </p>
                        ));
                      })()
                    ) : (
                      <p>{data.description}</p>
                    )}
                  </div>
                </div>

                {/* Institution Information */}
                {data.completedAtInstitution && (
                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">🏫</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">Completed at Institution</h4>
                          <p className="text-sm text-blue-700">{data.completedAtInstitution}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technologies/Skills */}
                {technologies.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Code className="w-5 h-5" />
                      <span>{type === 'project' ? 'Technologies Used' : 'Skills & Technologies'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1"
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      {type === 'project' ? <Award className="w-5 h-5" /> : <Code className="w-5 h-5" />}
                      <span>Linked {type === 'project' ? 'Certificates' : 'Projects'}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {linkedItemsList.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                        >
                          {type === 'project' ? <Award className="w-5 h-5 text-primary-600" /> : <Code className="w-5 h-5 text-primary-600" />}
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-600">
                              {type === 'project' ? item.issuer : item.category}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reports Section */}
                {data.reports && data.reports.length > 0 && (() => {
                  const visibleReports = data.reports.filter(report => report.visible !== false);
                  return visibleReports.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span>Reports & Documentation</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleReports.map((report, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                          >
                            {report.type === 'file' ? (
                              <FileText className="w-5 h-5 text-purple-600" />
                            ) : (
                              <ExternalLink className="w-5 h-5 text-green-600" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{report.title}</div>
                              {report.description && (
                                <div className="text-sm text-gray-600 truncate">{report.description}</div>
                              )}
                              <div className="flex items-center space-x-2 mt-1">
                                {report.type === 'file' && (
                                  <span className="text-xs text-gray-500">
                                    {report.file.originalName}
                                  </span>
                                )}
                                {report.type === 'link' && (
                                  <span className="text-xs text-gray-500 capitalize">
                                    {report.link.platform}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {report.type === 'file' && (
                                <a
                                  href={report.file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                                  title="Download file"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                              {report.type === 'link' && (
                                <a
                                  href={report.link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:text-green-700 transition-colors"
                                  title="Open link"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Project Links */}
                {type === 'project' && ((data.liveUrls && data.liveUrls.length > 0) || (data.githubUrls && data.githubUrls.length > 0)) && (
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.liveUrls?.map((url, index) => (
                        url && (
                          <a
                            key={`live-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                          >
                            <ExternalLink className="w-5 h-5 text-primary-600" />
                            <div>
                              <div className="font-medium text-gray-900">Live Demo {index + 1}</div>
                              <div className="text-sm text-gray-600 truncate">{url}</div>
                            </div>
                          </a>
                        )
                      ))}
                      {data.githubUrls?.map((url, index) => (
                        url && (
                          <a
                            key={`github-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                          >
                            <Github className="w-5 h-5 text-primary-600" />
                            <div>
                              <div className="font-medium text-gray-900">GitHub Repository {index + 1}</div>
                              <div className="text-sm text-gray-600 truncate">{url}</div>
                            </div>
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificate Files */}
                {type === 'certificate' && data.files && data.files.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Certificate Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.files.map((file, fileIndex) => (
                        <a
                          key={file._id || fileIndex}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                        >
                          {file.mimeType?.startsWith('image/') ? (
                            <Image className="w-5 h-5 text-primary-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary-600" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{file.originalName}</div>
                            <div className="text-sm text-gray-600">
                              {file.mimeType} • {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </a>
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

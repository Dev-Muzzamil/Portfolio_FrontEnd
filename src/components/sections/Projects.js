import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Github, Eye, Filter, ChevronDown, Calendar, Code, Monitor, Award } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { getApiBaseUrl } from '../../utils/helpers';
import TechnologyIcon from '../TechnologyIcon';

const Projects = () => {
  const { projects, certificates, loading } = useData();
  const [filter, setFilter] = useState('all');
  const [expandedProject, setExpandedProject] = useState(null);
  const [websitePreviews, setWebsitePreviews] = useState({});

  // (moved) loadWebsitePreview and auto-loader will be declared after filteredProjects

  const categories = ['all', 'web', 'mobile', 'ai-ml-dl', 'other'];
  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.category === filter);

  // Load website preview into state for a given projectId and liveUrl
  const loadWebsitePreview = useCallback(async (projectId, liveUrl) => {
    if (!liveUrl || websitePreviews[projectId]?.url) return;

    try {
      setWebsitePreviews(prev => ({
        ...prev,
        [projectId]: { url: null, loading: true, error: false }
      }));

      const apiBase = getApiBaseUrl();

      // First, check if we have existing screenshots for this project
      try {
        const existingScreenshotsResponse = await fetch(`${apiBase}/api/projects/screenshots/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (existingScreenshotsResponse.ok) {
          const existingScreenshots = await existingScreenshotsResponse.json();
          
          if (existingScreenshots.length > 0) {
            // Check if the most recent screenshot is less than 12 hours old
            const mostRecent = existingScreenshots[0]; // Assuming they're sorted by date
            const screenshotAge = Date.now() - new Date(mostRecent.createdAt).getTime();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;

            if (screenshotAge < twelveHoursInMs) {
              console.log(`Using existing screenshot for project ${projectId} (${Math.round(screenshotAge / (60 * 60 * 1000))} hours old)`);
              setWebsitePreviews(prev => ({
                ...prev,
                [projectId]: { url: mostRecent.url, loading: false, error: false }
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

      // Set the URL directly; <img> will trigger load/error events
      setWebsitePreviews(prev => ({
        ...prev,
        [projectId]: { url: screenshotUrl, loading: false, error: false }
      }));

    } catch (error) {
      console.error('Error loading website preview:', error);
      setWebsitePreviews(prev => ({
        ...prev,
        [projectId]: { url: null, loading: false, error: true }
      }));
    }
  }, [websitePreviews]);

  // Auto-load website previews for projects without custom images
  useEffect(() => {
    // Auto-load for all projects with liveUrls, staggered to avoid bursts
    const toLoad = projects.filter(p => (!p.images || p.images.length === 0) && p.liveUrls && p.liveUrls.length > 0);

    toLoad.forEach((project, i) => {
      // small stagger to be polite to the screenshot API
      setTimeout(() => {
        loadWebsitePreview(project._id, project.liveUrls[0]);
      }, i * 500);
    });
  }, [projects, loadWebsitePreview]);

  const handleProjectClick = (project) => {
    console.log('Project clicked:', project.title, 'Current expanded:', expandedProject);
    setExpandedProject(expandedProject === project._id ? null : project._id);
  };

  const handleCloseExpanded = () => {
    setExpandedProject(null);
  };

  if (loading) {
    return (
      <section id="projects" className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="loading-spinner mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="section-padding bg-gray-50">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My <span className="text-primary-600">Projects</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Here are some of my recent projects that showcase my skills and experience
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                filter === category
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              {category === 'ai-ml-dl' ? 'AI/ML/DL' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 h-[28rem] flex flex-col overflow-hidden">
                {/* Project Image */}
                <div className="relative overflow-hidden rounded-t-lg h-56" style={{ aspectRatio: '16/9' }}>
                  {(() => {
                    // Debug logging

                    // Priority: Custom uploaded image > Website preview state > Live website screenshot > Fallback
                    const preview = websitePreviews[project._id];

                    if (project.images && project.images.length > 0) {
                      return (
                        <img
                          src={project.images[0].url}
                          alt={project.images[0].alt || project.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Attempt to load website screenshot into preview state
                            if (project.liveUrls && project.liveUrls.length > 0) {
                              loadWebsitePreview(project._id, project.liveUrls[0]);
                            }
                            // Show an inline SVG placeholder to avoid external DNS lookups
                            try {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'data:image/svg+xml;utf8,' +
                                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
                                '<rect width="100%" height="100%" fill="%23f3f4f6"/>' +
                                '<text x="50%" y="50%" font-size="20" fill="%23666" dominant-baseline="middle" text-anchor="middle">No image</text>' +
                                '</svg>';
                            } catch (err) {}
                          }}
                        />
                      );
                    }

                    // If we already loaded a preview into state, use it
                    if (preview && preview.url) {
                      return (
                        <div className="relative">
                          <img
                            src={preview.url}
                            alt={`${project.title} website preview`}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            onLoad={() => {}}
                            onError={(e) => {
                              setWebsitePreviews(prev => ({
                                ...prev,
                                [project._id]: { url: null, loading: false, error: true }
                              }));
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                            <Monitor className="w-3 h-3" />
                            <span>Live Preview</span>
                          </div>
                        </div>
                      );
                    }

                    if (project.liveUrls && project.liveUrls.length > 0) {
                      // Direct API call with cache-busting for fresh screenshots
                      const apiBase = getApiBaseUrl();
                      const screenshotUrl = `${apiBase}/api/projects/screenshot?url=${encodeURIComponent(project.liveUrls[0])}&t=${Date.now()}`;

                      return (
                        <div className="relative">
                          <img
                            src={screenshotUrl}
                            alt={`${project.title} website preview`}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            onLoad={() => {}}
                            onError={(e) => {
                              // Could show a fallback here
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                            <Monitor className="w-3 h-3" />
                            <span>Live Preview</span>
                          </div>
                        </div>
                      );
                    }

                    // Default fallback
                    return (
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-4xl mb-2 block">💻</span>
                          <p className="text-primary-600 font-medium">No Preview Available</p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-wrap gap-2 justify-center">
                      {project.liveUrls && project.liveUrls.map((url, index) => (
                        url && (
                          <a
                            key={`live-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-colors duration-200"
                            title={`Live Demo ${index + 1}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )
                      ))}
                      {project.githubUrls && project.githubUrls.map((url, index) => (
                        url && (
                          <a
                            key={`github-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-colors duration-200"
                            title={`GitHub Repo ${index + 1}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Github className="w-5 h-5" />
                          </a>
                        )
                      ))}
                    </div>
                  </div>


                  {/* Expand Indicator */}
                  <div className="absolute bottom-4 right-4">
                    <ChevronDown className="w-5 h-5 text-white bg-black bg-opacity-50 rounded-full p-1" />
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Title and Category Section - Fixed Height */}
                  <div className="h-14 flex items-center mb-2">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 flex-1 pr-2 text-justify leading-tight">
                        {project.title}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                        {project.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description Section - Fixed Height */}
                  <div className="h-16 flex items-start mb-2">
                    <p className="text-sm text-gray-600 line-clamp-3 h-full overflow-hidden w-full text-justify leading-relaxed">
                      {project.shortDescription}
                    </p>
                  </div>

                  {/* Technologies Section - Fixed Height */}
                  <div className="h-12 flex items-start mb-2">
                    {project.technologies && project.technologies.length > 0 ? (
                      <div className="flex flex-wrap gap-1 w-full">
                        {project.technologies.slice(0, 4).map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1"
                          >
                            <TechnologyIcon technology={tech} className="w-3 h-3" />
                            <span>{tech}</span>
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                            +{project.technologies.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full"></div>
                    )}
                  </div>

                  {/* Linked Certificates Section */}
                  {project.linkedCertificates && project.linkedCertificates.length > 0 && (
                    <div className="h-10 flex items-start mb-2">
                      <div className="flex flex-wrap gap-1 w-full">
                        {project.linkedCertificates.slice(0, 2).map((certId) => {
                          const certificate = certificates.find(cert => cert._id === certId);
                          return certificate ? (
                            <span
                              key={certId}
                              className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1"
                            >
                              <Award className="w-3 h-3" />
                              <span>{certificate.title}</span>
                            </span>
                          ) : null;
                        })}
                        {project.linkedCertificates.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                            +{project.linkedCertificates.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Spacer to push status to bottom */}
                  <div className="flex-1"></div>

                  {/* Status and Actions Section - Fixed Height */}
                  <div className="h-12 flex items-center pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between w-full">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'completed' 
                          ? 'bg-green-100 text-green-700'
                          : project.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {project.status.replace('-', ' ')}
                      </span>
                      
                      <div className="flex space-x-1">
                        {project.liveUrls && project.liveUrls.slice(0, 2).map((url, index) => (
                          url && (
                            <a
                              key={`live-${index}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                              title={`Live Demo ${index + 1}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="w-3 h-3" />
                            </a>
                          )
                        ))}
                        {project.githubUrls && project.githubUrls.slice(0, 2).map((url, index) => (
                          url && (
                            <a
                              key={`github-${index}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                              title={`GitHub Repo ${index + 1}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Github className="w-3 h-3" />
                            </a>
                          )
                        ))}
                        {(project.liveUrls && project.liveUrls.length > 2) || (project.githubUrls && project.githubUrls.length > 2) ? (
                          <span className="text-gray-400 text-xs">+more</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Expanded Project Modal */}
        <AnimatePresence>
          {expandedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseExpanded}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white rounded-2xl w-[75vw] h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const project = projects.find(p => p._id === expandedProject);
                  if (!project) return null;

                  return (
                    <div className="overflow-y-auto" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f3f4f6'
                    }}>
                      {/* Project Images */}
                      <div className="relative h-[540px] overflow-hidden">
                        {(() => {

                          const preview = websitePreviews[project._id];

                          if (project.images && project.images.length > 0) {
                            return (
                              <img
                                src={project.images[0].url}
                                alt={project.images[0].alt || project.title}
                                className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                                style={{ aspectRatio: '16/9' }}
                                onError={(e) => {
                                  if (project.liveUrls && project.liveUrls.length > 0) {
                                    loadWebsitePreview(project._id, project.liveUrls[0]);
                                  }
                                  try {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'data:image/svg+xml;utf8,' +
                                      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">' +
                                      '<rect width="100%" height="100%" fill="%23f3f4f6"/>' +
                                      '<text x="50%" y="50%" font-size="28" fill="%23666" dominant-baseline="middle" text-anchor="middle">No image</text>' +
                                      '</svg>';
                                  } catch (err) {}
                                }}
                              />
                            );
                          }

                          if (preview && preview.url) {
                            return (
                              <img
                                src={preview.url}
                                alt={`${project.title} website preview`}
                                className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                                style={{ aspectRatio: '16/9' }}
                                onLoad={() => {}}
                                onError={(e) => {}}
                              />
                            );
                          }

                          if (project.liveUrls && project.liveUrls.length > 0) {
                            // Direct API call with cache-busting for fresh screenshots
                            const screenshotUrl = `${getApiBaseUrl()}/api/projects/screenshot?url=${encodeURIComponent(project.liveUrls[0])}&t=${Date.now()}`;

                            return (
                              <img
                                src={screenshotUrl}
                                alt={`${project.title} website preview`}
                                className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                                style={{ aspectRatio: '16/9' }}
                                onLoad={() => {}}
                                onError={(e) => {
                                }}
                              />
                            );
                          }

                          return (
                            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-6xl mb-4 block">💻</span>
                                <p className="text-primary-600 font-medium">No Preview Available</p>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Overlay with Links */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-8">
                          <div className="flex flex-wrap gap-4">
                            {project.liveUrls && project.liveUrls.map((url, index) => (
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
                            {project.githubUrls && project.githubUrls.map((url, index) => (
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
                          </div>
                        </div>
                        </div>

                      {/* Project Details */}
                      <div className="p-6 md:p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{project.title}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded capitalize text-xs font-medium">
                                {project.category}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                project.status === 'completed' 
                                  ? 'bg-green-100 text-green-700'
                                  : project.status === 'in-progress'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {project.status.replace('-', ' ')}
                              </span>
                              <span className="flex items-center space-x-1 text-gray-600 text-xs">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Full Description */}
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Project</h3>
                          <div className="text-gray-600 leading-relaxed text-justify text-sm">
                            {(() => {
                              // Split by double line breaks first
                              let paragraphs = project.description.split('\n\n').filter(p => p.trim());

                              // If no double line breaks, try single line breaks
                              if (paragraphs.length === 1) {
                                paragraphs = project.description.split('\n').filter(p => p.trim());
                              }

                              // If still no breaks, try to split by sentences (period followed by space and capital letter)
                              if (paragraphs.length === 1) {
                                paragraphs = project.description.split(/\.\s+(?=[A-Z])/).filter(p => p.trim());
                              }

                              return paragraphs.map((paragraph, index) => (
                                <p key={index} className="mb-4 last:mb-0 indent-4 first:indent-0">
                                  {paragraph.trim()}{paragraphs.length > 1 && index < paragraphs.length - 1 ? '.' : ''}
                                </p>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                              <Code className="w-5 h-5" />
                              <span>Technologies Used</span>
                            </h3>
                            <div className="flex flex-wrap gap-1">
                              {project.technologies.map((tech, techIndex) => (
                                <span
                                  key={techIndex}
                                  className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium whitespace-nowrap flex items-center space-x-1"
                                >
                                  <TechnologyIcon technology={tech} className="w-3 h-3" />
                                  <span>{tech}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Project Links */}
                        {(project.liveUrls && project.liveUrls.length > 0) || (project.githubUrls && project.githubUrls.length > 0) ? (
                          <div className="border-t pt-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {project.liveUrls && project.liveUrls.map((url, index) => (
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
                              {project.githubUrls && project.githubUrls.map((url, index) => (
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
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">
              No projects match the selected category. Try selecting a different filter.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Projects;



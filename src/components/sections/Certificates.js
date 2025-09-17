import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ExternalLink, Calendar, Eye, FileText, Image, Code, ChevronDown, Play } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ImprovedPDFViewer from '../admin/ImprovedPDFViewer';

const Certificates = () => {
  const { certificates, projects, loading } = useData();
  const [expandedCertificate, setExpandedCertificate] = useState(null);
  const [viewingPDF, setViewingPDF] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  // Helper function to parse skills array
  const parseSkills = (skills) => {
    if (!skills || !Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      // If skill is a string that looks like JSON, parse it
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
  };

  const handleCertificateClick = (certificate) => {
    setExpandedCertificate(expandedCertificate === certificate._id ? null : certificate._id);
  };

  const handleCloseExpanded = () => {
    setExpandedCertificate(null);
  };

  const handleViewPDF = (file) => {
    setPdfFile(file);
    setViewingPDF(file.url);
  };

  const handleClosePDF = () => {
    setViewingPDF(null);
    setPdfFile(null);
  };


  // Get thumbnail URL for files
  const getThumbnailUrl = (file) => {
    // If file has a thumbnail URL (for PDFs), use it
    if (file.thumbnailUrl) {
      return file.thumbnailUrl;
    }
    
    // For images, use the original URL
    if (file.mimeType?.startsWith('image/')) {
      return file.url;
    }
    
    // For PDFs without thumbnail, return null to show fallback
    if (file.mimeType?.includes('pdf')) {
      return null;
    }
    
    // For other files, return original URL
    return file.url;
  };

  if (loading) {
    return (
      <section id="certificates" className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="loading-spinner mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="certificates" className="section-padding bg-gray-50">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My <span className="text-primary-600">Certificates</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional certifications and achievements that validate my expertise
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((certificate, index) => {
            const parsedSkills = parseSkills(certificate.skills);
            return (
              <motion.div
                key={certificate._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => handleCertificateClick(certificate)}
              >
                <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 min-h-96 flex flex-col overflow-hidden">
                  {/* Certificate Image/Preview */}
                  <div className="relative overflow-hidden rounded-t-lg h-48 flex-shrink-0">
                    {/* Show primary file if available, otherwise show image or default */}
                    {certificate.files && certificate.files.length > 0 ? (
                      (() => {
                        const primaryFile = certificate.files.find(f => f.isPrimary) || certificate.files[0];
                        return primaryFile.mimeType?.startsWith('image/') ? (
                          <img
                            src={primaryFile.url}
                            alt={primaryFile.originalName}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : primaryFile.mimeType?.includes('pdf') ? (
                          <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                            {/* PDF Thumbnail or Fallback */}
                            {getThumbnailUrl(primaryFile) ? (
                              <img
                                src={getThumbnailUrl(primaryFile)}
                                alt={`${primaryFile.originalName} thumbnail`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  // Fallback to icon if thumbnail fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            {/* Fallback PDF Icon */}
                            <div className={`w-full h-full flex items-center justify-center ${getThumbnailUrl(primaryFile) ? 'hidden' : ''}`}>
                              <div className="text-center">
                                <FileText className="w-16 h-16 text-blue-600 mx-auto mb-3" />
                                <p className="text-sm text-blue-700 font-medium px-2">{primaryFile.originalName}</p>
                                <p className="text-xs text-blue-500 mt-1">PDF Document</p>
                              </div>
                            </div>
                            
                            {/* PDF Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPDF(primaryFile);
                                  }}
                                  className="flex items-center space-x-2 px-6 py-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                                  title="View PDF"
                                >
                                  <Play className="w-4 h-4" />
                                  <span>View Certificate</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                              <p className="text-sm text-blue-700 font-medium">{primaryFile.originalName}</p>
                            </div>
                          </div>
                        );
                      })()
                    ) : certificate.image?.url ? (
                      <img
                        src={certificate.image.url}
                        alt={certificate.image.alt || certificate.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <Award className="w-16 h-16 text-primary-600" />
                      </div>
                    )}
                    
                    {/* Overlay with actions - only show for non-PDF files */}
                    {certificate.files && certificate.files.length > 0 && !certificate.files.find(f => f.isPrimary)?.mimeType?.includes('pdf') && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center space-x-2">
                        {/* View primary file */}
                        <a
                          href={certificate.files.find(f => f.isPrimary)?.url || certificate.files[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-colors duration-200"
                          title="View Certificate"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                      </div>
                    )}
                    
                    {/* Credential URL */}
                    {certificate.credentialUrl && (
                      <a
                        href={certificate.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-colors duration-200"
                        title="Verify Certificate"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}

                    {/* Expand Indicator */}
                    <div className="absolute bottom-4 right-4">
                      <ChevronDown className="w-5 h-5 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 mb-2 line-clamp-2 leading-tight">
                        {certificate.title}
                      </h3>
                      <p className="text-primary-600 font-semibold text-sm truncate">{certificate.issuer}</p>
                    </div>

                    {/* Date */}
                    <div className="flex items-center space-x-2 text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">
                        {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </span>
                    </div>

                    {/* Description */}
                    {certificate.description && (
                      <div className="mb-3 flex-1">
                        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                          {certificate.description}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {parsedSkills.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {parsedSkills.slice(0, 3).map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium truncate max-w-24"
                              title={skill}
                            >
                              {skill}
                            </span>
                          ))}
                          {parsedSkills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              +{parsedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expand Indicator */}
                    <div className="absolute bottom-4 right-4">
                      <ChevronDown className="w-5 h-5 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>

                    {/* Linked Projects */}
                    {certificate.linkedProjects && certificate.linkedProjects.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {certificate.linkedProjects.slice(0, 2).map((projectId) => {
                            const project = projects.find(proj => proj._id === projectId);
                            return project ? (
                              <span
                                key={projectId}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center space-x-1 truncate max-w-32"
                                title={project.title}
                              >
                                <Code className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{project.title}</span>
                              </span>
                            ) : null;
                          })}
                          {certificate.linkedProjects.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              +{certificate.linkedProjects.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Info Section */}
                    <div className="mt-auto space-y-2">
                      {/* Credential ID */}
                      {certificate.credentialId && (
                        <div className="text-xs text-gray-500 truncate" title={`Credential ID: ${certificate.credentialId}`}>
                          <span className="font-medium">ID:</span> {certificate.credentialId}
                        </div>
                      )}

                      {/* Expiry Date */}
                      {certificate.expiryDate && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Expires:</span> {new Date(certificate.expiryDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      )}

                      {/* Certificate Files */}
                      {certificate.files && certificate.files.length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {certificate.files.length} file{certificate.files.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex space-x-1">
                              {certificate.files.slice(0, 2).map((file, fileIndex) => (
                                <a
                                  key={file._id || fileIndex}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                  title={`View ${file.originalName}`}
                                >
                                  {file.mimeType?.startsWith('image/') ? (
                                    <Image className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate max-w-12">{file.originalName.split('.')[0]}</span>
                                </a>
                              ))}
                              {certificate.files.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{certificate.files.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Expanded Certificate Modal */}
        <AnimatePresence>
          {expandedCertificate && (
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
                  const certificate = certificates.find(c => c._id === expandedCertificate);
                  if (!certificate) return null;

                  const parsedSkills = parseSkills(certificate.skills);

                  return (
                    <div className="overflow-y-auto" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f3f4f6'
                    }}>
                      {/* Certificate Image/Preview */}
                      <div className="relative h-[400px] overflow-hidden">
                        {certificate.files && certificate.files.length > 0 ? (
                          (() => {
                            const primaryFile = certificate.files.find(f => f.isPrimary) || certificate.files[0];
                            return primaryFile.mimeType?.startsWith('image/') ? (
                              <img
                                src={primaryFile.url}
                                alt={primaryFile.originalName}
                                className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                              />
                            ) : primaryFile.mimeType?.includes('pdf') ? (
                              <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                                {/* PDF Thumbnail or Fallback */}
                                {getThumbnailUrl(primaryFile) ? (
                                  <img
                                    src={getThumbnailUrl(primaryFile)}
                                    alt={`${primaryFile.originalName} thumbnail`}
                                    className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                                    onError={(e) => {
                                      // Fallback to icon if thumbnail fails to load
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                
                                {/* Fallback PDF Icon */}
                                <div className={`w-full h-full flex items-center justify-center ${getThumbnailUrl(primaryFile) ? 'hidden' : ''}`}>
                                  <div className="text-center">
                                    <FileText className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                                    <p className="text-lg text-blue-700 font-medium px-4">{primaryFile.originalName}</p>
                                    <p className="text-sm text-blue-500 mt-2">PDF Document</p>
                                  </div>
                                </div>
                                
                                {/* PDF Overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                  <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewPDF(primaryFile);
                                      }}
                                      className="flex items-center space-x-2 px-8 py-4 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                                    >
                                      <Play className="w-5 h-5" />
                                      <span>View Certificate</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <div className="text-center">
                                  <FileText className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                                  <p className="text-lg text-blue-700 font-medium">{primaryFile.originalName}</p>
                                </div>
                              </div>
                            );
                          })()
                        ) : certificate.image?.url ? (
                          <img
                            src={certificate.image.url}
                            alt={certificate.image.alt || certificate.title}
                            className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                            <Award className="w-24 h-24 text-primary-600" />
                          </div>
                        )}
                        
                        {/* Overlay with Actions - only show for non-PDF files */}
                        {certificate.files && certificate.files.length > 0 && !certificate.files.find(f => f.isPrimary)?.mimeType?.includes('pdf') && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-8">
                            <div className="flex flex-wrap gap-4">
                              <a
                                href={certificate.files.find(f => f.isPrimary)?.url || certificate.files[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Certificate</span>
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {certificate.credentialUrl && (
                          <a
                            href={certificate.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary-600 hover:text-white transition-all duration-300 text-sm font-semibold shadow-xl hover:shadow-2xl hover:scale-105"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Verify Certificate</span>
                          </a>
                        )}
                      </div>

                      {/* Certificate Details */}
                      <div className="p-6 md:p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{certificate.title}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                {certificate.issuer}
                              </span>
                              <span className="flex items-center space-x-1 text-gray-600 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(certificate.issueDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long'
                                })}</span>
                              </span>
                              {certificate.credentialId && (
                                <span className="text-gray-500 text-sm">
                                  ID: {certificate.credentialId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Full Description */}
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Certificate</h3>
                          <div className="text-gray-600 leading-relaxed text-justify">
                            {certificate.description}
                          </div>
                        </div>

                        {/* Skills */}
                        {parsedSkills.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                              <Code className="w-5 h-5" />
                              <span>Skills & Technologies</span>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {parsedSkills.map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Certificate Files */}
                        {certificate.files && certificate.files.length > 0 && (
                          <div className="border-t pt-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Certificate Files</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {certificate.files.map((file, fileIndex) => (
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
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {certificates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No certificates added yet</h3>
            <p className="text-gray-600">
              Certificates will be displayed here once they are added to the admin panel.
            </p>
          </motion.div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewingPDF && pdfFile && (
        <ImprovedPDFViewer
          pdfUrl={viewingPDF}
          fileName={pdfFile.originalName}
          onClose={handleClosePDF}
          hideDownload={true}
        />
      )}
    </section>
  );
};

export default Certificates;
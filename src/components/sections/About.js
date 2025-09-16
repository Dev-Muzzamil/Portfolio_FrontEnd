import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, FileText, Eye } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ImprovedPDFViewer from '../admin/ImprovedPDFViewer';

const About = () => {
  const { about, configuration, loading } = useData();
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  const handleViewResume = (resume) => {
    if (resume.mimeType === 'application/pdf') {
      setSelectedResume(resume);
      setShowPDFViewer(true);
    } else {
      // For non-PDF files, try to open in new tab
      window.open(resume.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Download functionality removed - only admins can download

  if (loading) {
    return (
      <section id="about" className="section-padding bg-white">
        <div className="container-max">
          <div className="loading-spinner mx-auto"></div>
        </div>
      </section>
    );
  }

  if (!about) {
    return null;
  }

  return (
    <section id="about" className="section-padding bg-gray-50">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About <span className="text-primary-600">Me</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get to know more about my background, experience, and passion for technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Bio Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Who I Am</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {configuration?.siteInfo?.bio || about.bio || 'A detailed description about your background, experience, and passion for technology.'}
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">{configuration?.stats?.yearsExperience || 2}+</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">{configuration?.stats?.projectsCount || 10}+</div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600 mb-1">{configuration?.stats?.technologiesCount || 5}+</div>
                  <div className="text-sm text-gray-600">Technologies</div>
                </div>
              </div>
            </div>

                    {/* Contact Info */}
                    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h4>
                      <div className="space-y-3">
                        {(configuration?.contactInfo?.email || about?.email) && (
                          <div className="flex items-center space-x-3 text-gray-600">
                            <Mail className="w-5 h-5 text-primary-600" />
                            <span>{configuration?.contactInfo?.email || about?.email}</span>
                          </div>
                        )}
                        {(configuration?.contactInfo?.phone || about?.phone) && (
                          <div className="flex items-center space-x-3 text-gray-600">
                            <Phone className="w-5 h-5 text-primary-600" />
                            <span>{configuration?.contactInfo?.phone || about?.phone}</span>
                          </div>
                        )}
                        {(configuration?.contactInfo?.location || about?.location) && (
                          <div className="flex items-center space-x-3 text-gray-600">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            <span>{configuration?.contactInfo?.location || about?.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resume Download */}
                    {about?.resumes && about.resumes.length > 0 && (
                      <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                        <h4 className="text-xl font-semibold text-gray-900 mb-6">Resume</h4>
                        <div className="space-y-4">
                          {about.resumes
                            .filter(resume => resume.isActive)
                            .map((resume, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-8 h-8 text-primary-600" />
                                <div>
                                  <h5 className="font-semibold text-gray-900">{resume.title}</h5>
                                  <p className="text-sm text-gray-500">
                                    {(resume.size / 1024 / 1024).toFixed(2)} MB • {resume.mimeType.split('/')[1].toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewResume(resume)}
                                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View</span>
                                </button>
                                {/* Download button removed - only admins can download */}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
          </motion.div>

          {/* Experience & Education */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Experience */}
            {about.experience && about.experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Experience</h3>
                <div className="space-y-6">
                  {about.experience.map((exp, index) => (
                    <div key={index} className="relative pl-8 border-l-4 border-primary-200">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full"></div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-primary-600 font-medium">{exp.company}</p>
                        <p className="text-gray-500 text-sm">{exp.duration}</p>
                        {exp.description && (
                          <p className="text-gray-600">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {about.education && about.education.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Education</h3>
                <div className="space-y-6">
                  {about.education
                    .sort((a, b) => {
                      // UCEOU gets highest priority
                      const aIsUCEOU = a.institution && a.institution.toLowerCase().includes('university college of engineering');
                      const bIsUCEOU = b.institution && b.institution.toLowerCase().includes('university college of engineering');
                      
                      if (aIsUCEOU && !bIsUCEOU) return -1;
                      if (!aIsUCEOU && bIsUCEOU) return 1;
                      
                      // Then sort by degree level: M.Tech, B.Tech first, then Diploma, then High School
                      const degreeOrder = {
                        'M.Tech': 1,
                        'B.Tech': 2,
                        'Bachelor': 2,
                        'Master': 1,
                        'Diploma': 3,
                        'SSC': 4,
                        'High School': 4,
                        '10th': 4,
                        '12th': 3
                      };
                      
                      const aOrder = degreeOrder[a.degree] || 5;
                      const bOrder = degreeOrder[b.degree] || 5;
                      
                      return aOrder - bOrder;
                    })
                    .map((edu, index) => (
                    <div key={index} className="relative pl-8 border-l-4 border-primary-200">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full"></div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-primary-600">{edu.institution}</h4>
                        <p className="text-gray-900 font-medium">{edu.degree}</p>
                        {edu.field && (
                          <p className="text-gray-600 font-medium">{edu.field}</p>
                        )}
                        <p className="text-gray-500 text-sm">{edu.duration}</p>
                        {edu.description && (
                          <p className="text-gray-600">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedResume && (
        <ImprovedPDFViewer
          pdfUrl={selectedResume.url}
          fileName={selectedResume.title}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedResume(null);
          }}
        />
      )}
    </section>
  );
};

export default About;

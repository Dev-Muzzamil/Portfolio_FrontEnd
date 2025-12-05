import React from 'react';
import { motion } from 'framer-motion';
import { Award, ExternalLink, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Certificates = () => {
  const { certificates, loading } = useData();

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
          {certificates.map((certificate, index) => (
            <motion.div
              key={certificate._id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 h-80 flex flex-col overflow-hidden">
                {/* Certificate Image */}
                <div className="relative overflow-hidden rounded-t-lg h-48 flex-shrink-0">
                  {certificate.image?.url ? (
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
                  
                  {/* Overlay */}
                  {certificate.credentialUrl && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                      <a
                        href={certificate.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white rounded-full hover:bg-primary-600 hover:text-white transition-colors duration-200"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Certificate Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-200 mb-2">
                      {certificate.title}
                    </h3>
                    <p className="text-primary-600 font-semibold">{certificate.issuer}</p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  </div>

                  {/* Description */}
                  {certificate.description && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {certificate.description}
                    </p>
                  )}

                  {/* Skills */}
                  {certificate.skills && certificate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {certificate.skills.slice(0, 3).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {certificate.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          +{certificate.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Credential ID */}
                  {certificate.credentialId && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Credential ID: {certificate.credentialId}
                      </p>
                    </div>
                  )}

                  {/* Expiry Date */}
                  {certificate.expiryDate && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(certificate.expiryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
    </section>
  );
};

export default Certificates;



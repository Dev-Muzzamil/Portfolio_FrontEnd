import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Briefcase, GraduationCap, User, Code, Award, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const About = () => {
  const { about, loading } = useData();

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
    <section id="about" className="section-padding bg-white">
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
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-8 shadow-lg border border-primary-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Who I Am</h3>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {about.bio || 'I am a postgraduate student from Hyderabad, pursuing an M.Tech in Computer Science (AI & ML) from Osmania University. I have a knowledge of Java, Python, and web technologies, with a strong foundation in AI, machine learning, and sentiment analysis.'}
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-primary-100">
                  <div className="text-2xl font-bold text-primary-600 mb-1">2+</div>
                  <div className="text-sm text-gray-600">Years</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-primary-100">
                  <div className="text-2xl font-bold text-primary-600 mb-1">10+</div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-primary-100">
                  <div className="text-2xl font-bold text-primary-600 mb-1">5+</div>
                  <div className="text-sm text-gray-600">Skills</div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">Contact Information</h4>
              </div>
              <div className="space-y-4">
                {about.email && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                    <Mail className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700 font-medium">{about.email}</span>
                  </div>
                )}
                {about.phone && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                    <Phone className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700 font-medium">{about.phone}</span>
                  </div>
                )}
                {about.location && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-primary-50 transition-colors">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-700 font-medium">{about.location}</span>
                  </div>
                )}
              </div>
            </div>
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
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Experience</h3>
                </div>
                <div className="space-y-6">
                  {about.experience.map((exp, index) => (
                    <div key={index} className="relative pl-8 border-l-4 border-primary-200">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-primary-600 rounded-full"></div>
                      <div className="bg-gradient-to-r from-primary-50 to-white rounded-xl p-6 border border-primary-100">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{exp.position}</h4>
                        <p className="text-primary-600 font-medium mb-2">{exp.company}</p>
                        <p className="text-gray-500 text-sm mb-3 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {exp.duration}
                        </p>
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
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-4">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Education</h3>
                </div>
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
                      <div className="bg-gradient-to-r from-primary-50 to-white rounded-xl p-6 border border-primary-100">
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-primary-600">{edu.institution}</h4>
                          <p className="text-gray-900 font-medium">{edu.degree}</p>
                          {edu.field && (
                            <p className="text-gray-600 font-medium">{edu.field}</p>
                          )}
                          <p className="text-gray-500 text-sm flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {edu.duration}
                          </p>
                          {edu.description && (
                            <p className="text-gray-600">{edu.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;

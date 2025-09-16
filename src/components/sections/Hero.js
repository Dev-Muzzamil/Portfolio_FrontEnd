import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Eye, Github, Linkedin, Twitter, Globe } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Hero = () => {
  const { about, configuration, loading } = useData();

  const scrollToAbout = () => {
    const element = document.querySelector('#about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">

      <div className="container-max section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight"
              >
                Hello, I'm{' '}
                <span className="text-primary-600">
                  {configuration?.siteInfo?.name || about?.name || 'Your Name'}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 font-medium"
              >
                {configuration?.siteInfo?.title || about?.title || 'Your Professional Title'}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg text-gray-500 max-w-2xl"
              >
                {configuration?.siteInfo?.shortBio || about?.shortBio || 'A brief description about yourself and your expertise.'}
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={scrollToAbout}
                className="btn-primary flex items-center justify-center space-x-2 px-8 py-3 text-lg"
              >
                <span>Get to know me</span>
                <ChevronDown className="w-5 h-5" />
              </button>
              
              {about?.resumes && about.resumes.find(r => r.isActive) && (
                <a
                  href={about.resumes.find(r => r.isActive).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline flex items-center justify-center space-x-2 px-8 py-3 text-lg"
                >
                  <Eye className="w-5 h-5" />
                  <span>View CV</span>
                </a>
              )}
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex space-x-6"
            >
              {(configuration?.socialLinks?.github || about?.socialLinks?.github) && (
                <a
                  href={configuration?.socialLinks?.github || about?.socialLinks?.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Github className="w-6 h-6" />
                </a>
              )}
              {(configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin) && (
                <a
                  href={configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {(configuration?.socialLinks?.twitter || about?.socialLinks?.twitter) && (
                <a
                  href={configuration?.socialLinks?.twitter || about?.socialLinks?.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {(configuration?.socialLinks?.website || about?.socialLinks?.website) && (
                <a
                  href={configuration?.socialLinks?.website || about?.socialLinks?.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Globe className="w-6 h-6" />
                </a>
              )}
            </motion.div>
          </motion.div>

          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-8">
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                {(configuration?.profilePhoto?.url || about?.photo?.url) ? (
                  <img
                    src={configuration?.profilePhoto?.url || about?.photo?.url}
                    alt={configuration?.profilePhoto?.alt || configuration?.siteInfo?.name || about?.name || 'Profile'}
                    className="w-60 h-60 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-60 h-60 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary-600">
                      {(configuration?.siteInfo?.name || about?.name || 'Y').charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.button
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={scrollToAbout}
          className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </section>
  );
};

export default Hero;

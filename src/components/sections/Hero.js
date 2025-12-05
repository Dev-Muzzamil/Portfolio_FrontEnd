import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Download, Github, Linkedin, Twitter, Globe } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Hero = () => {
  const { about, loading } = useData();

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
    <section className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

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
                  {about?.name || 'Syed Muzzamil Ali'}
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 font-medium"
              >
                {about?.title || 'Computer Science Engineer & Tech Enthusiast'}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-lg text-gray-500 max-w-2xl"
              >
                {about?.shortBio || 'Postgraduate student pursuing M.Tech in Computer Science (AI & ML) from Osmania University. Passionate about AI, machine learning, and building innovative solutions.'}
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
              
              {about?.resume?.url && (
                <a
                  href={about.resume.url}
                  download
                  className="btn-outline flex items-center justify-center space-x-2 px-8 py-3 text-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>Download CV</span>
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
              {about?.socialLinks?.github && (
                <a
                  href={about.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Github className="w-6 h-6" />
                </a>
              )}
              {about?.socialLinks?.linkedin && (
                <a
                  href={about.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
              {about?.socialLinks?.twitter && (
                <a
                  href={about.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {about?.socialLinks?.website && (
                <a
                  href={about.socialLinks.website}
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
            <div className="relative">
              <div className="w-80 h-80 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                {about?.photo?.url ? (
                  <img
                    src={about.photo.url}
                    alt={about.name || 'Profile'}
                    className="w-72 h-72 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-72 h-72 bg-white rounded-full flex items-center justify-center">
                    <span className="text-6xl font-bold text-primary-600">
                      {about?.name?.charAt(0) || 'Y'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-2xl">🚀</span>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-xl">💻</span>
              </motion.div>
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

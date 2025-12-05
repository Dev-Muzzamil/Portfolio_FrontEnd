import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Twitter, Globe, Heart, MapPin, Phone } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Footer = () => {
  const { about, configuration } = useData();
  const currentYear = new Date().getFullYear();


  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      href: configuration?.socialLinks?.github || about?.socialLinks?.github,
      color: 'hover:text-gray-300'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin,
      color: 'hover:text-blue-400'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: configuration?.socialLinks?.twitter || about?.socialLinks?.twitter,
      color: 'hover:text-blue-400'
    },
    {
      name: 'Website',
      icon: Globe,
      href: configuration?.socialLinks?.website || about?.socialLinks?.website,
      color: 'hover:text-green-400'
    },
    {
      name: 'Email',
      icon: Mail,
      href: configuration?.socialLinks?.email || about?.email ? `mailto:${configuration?.socialLinks?.email || about?.email}` : null,
      color: 'hover:text-red-400'
    }
  ].filter(link => link.href);

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container-max section-padding">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-4 gap-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Contact Info Section */}
            <motion.div 
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="flex items-start space-x-6">
                {/* Logo positioned on the left, slightly outside */}
                <div className="-ml-4">
                  {configuration?.branding?.icon ? (
                    <motion.img
                      src={configuration.branding.icon}
                      alt="Icon"
                      className="w-16 h-16 object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {(configuration?.siteInfo?.name || about?.name || 'Y').charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {configuration?.siteInfo?.name || about?.name || 'Your Name'}
                  </h3>
                  <p className="text-primary-400 font-medium">
                    {configuration?.siteInfo?.title || about?.title || 'Professional Title'}
                  </p>
                  
                  {/* Contact Info */}
                  <div className="space-y-3">
                    {about?.email && (
                      <div className="flex items-center space-x-3 text-gray-300">
                        <Mail className="w-5 h-5 text-primary-400" />
                        <a href={`mailto:${about.email}`} className="hover:text-white transition-colors duration-200">
                          {about.email}
                        </a>
                      </div>
                    )}
                    {about?.phone && (
                      <div className="flex items-center space-x-3 text-gray-300">
                        <Phone className="w-5 h-5 text-primary-400" />
                        <a href={`tel:${about.phone}`} className="hover:text-white transition-colors duration-200">
                          {about.phone}
                        </a>
                      </div>
                    )}
                    {about?.location && (
                      <div className="flex items-center space-x-3 text-gray-300">
                        <MapPin className="w-5 h-5 text-primary-400" />
                        <span>{about.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <h3 className="text-xl font-bold text-white">Quick Links</h3>
              <ul className="space-y-3">
                {configuration?.navigation?.filter(nav => nav.visible).map((nav, index) => (
                  <motion.li 
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a 
                      href={nav.href} 
                      className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 group-hover:bg-primary-300 transition-colors duration-200"></span>
                      {nav.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Social Links */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <h3 className="text-xl font-bold text-white">Let's Connect</h3>
              <div className="grid grid-cols-2 gap-4">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 ${link.color} group`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{link.name}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Section */}
          <motion.div 
            className="border-t border-gray-700/50 mt-16 pt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2 text-gray-400">
                <span>Made with</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Heart className="w-4 h-4 text-red-500" />
                </motion.div>
                <span>by {configuration?.siteInfo?.name || about?.name || 'Your Name'}</span>
                <span className="text-gray-600">•</span>
                <span>© {currentYear} All rights reserved</span>
              </div>

              <div className="flex items-center space-x-6">
                {configuration?.footer?.showAdminLink !== false && (
                  <a 
                    href="/admin/login" 
                    className="text-gray-500 hover:text-gray-300 text-sm transition-colors duration-200"
                    title="Admin Access"
                  >
                    Admin
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



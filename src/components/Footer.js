import React from 'react';
import { Github, Linkedin, Mail, Twitter, Globe } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Footer = () => {
  const { about, configuration } = useData();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-white">
      <div className="container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-xl font-bold">{configuration?.footer?.brandName || configuration?.siteInfo?.name || about?.name || 'Your Name'}</span>
            </div>
            <p className="text-gray-400">
              {configuration?.footer?.description || configuration?.siteInfo?.shortBio || about?.shortBio || 'Professional description for footer.'}
            </p>
            <p className="text-gray-500 text-sm">
              {configuration?.footer?.website || configuration?.siteInfo?.website || about?.website || 'yoursite.com'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {configuration?.navigation?.filter(nav => nav.visible).map((nav, index) => (
                <li key={index}>
                  <a href={nav.href} className="text-gray-400 hover:text-white transition-colors duration-200">
                    {nav.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connect</h3>
            <div className="flex space-x-4">
              {(configuration?.socialLinks?.github || about?.socialLinks?.github) && (
                <a
                  href={configuration?.socialLinks?.github || about?.socialLinks?.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {(configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin) && (
                <a
                  href={configuration?.socialLinks?.linkedin || about?.socialLinks?.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {(configuration?.socialLinks?.twitter || about?.socialLinks?.twitter) && (
                <a
                  href={configuration?.socialLinks?.twitter || about?.socialLinks?.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {(configuration?.socialLinks?.website || about?.socialLinks?.website) && (
                <a
                  href={configuration?.socialLinks?.website || about?.socialLinks?.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {(configuration?.socialLinks?.email || about?.email) && (
                <a
                  href={`mailto:${configuration?.socialLinks?.email || about?.email}`}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} {configuration?.footer?.brandName || configuration?.siteInfo?.name || about?.name || 'Your Name'}. All rights reserved.
            {configuration?.footer?.showAdminLink !== false && (
              <a 
                href="/admin/login" 
                className="ml-4 text-gray-600 hover:text-gray-400 text-sm transition-colors duration-200"
                title="Admin Access"
              >
                Admin
              </a>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



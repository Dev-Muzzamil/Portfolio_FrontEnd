import React from 'react';
import { Github, Linkedin, Mail, Twitter, Globe } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Footer = () => {
  const { about } = useData();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-white">
      <div className="container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">Syed Muzzamil Ali</span>
            </div>
            <p className="text-gray-400">
              Computer Science Engineer & Tech Enthusiast. Building innovative solutions with AI, ML, and modern technologies.
            </p>
            <p className="text-gray-500 text-sm">
              syedmuzzamilali.me
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors duration-200">
                  About
                </a>
              </li>
              <li>
                <a href="#projects" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Projects
                </a>
              </li>
              <li>
                <a href="#skills" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Skills
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connect</h3>
            <div className="flex space-x-4">
              {about?.socialLinks?.github && (
                <a
                  href={about.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {about?.socialLinks?.linkedin && (
                <a
                  href={about.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {about?.socialLinks?.twitter && (
                <a
                  href={about.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {about?.socialLinks?.website && (
                <a
                  href={about.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {about?.email && (
                <a
                  href={`mailto:${about.email}`}
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
            © {currentYear} Syed Muzzamil Ali. All rights reserved.
            <a 
              href="/admin/login" 
              className="ml-4 text-gray-600 hover:text-gray-400 text-sm transition-colors duration-200"
              title="Admin Access"
            >
              Admin
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



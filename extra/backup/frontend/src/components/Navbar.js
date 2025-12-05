import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { smoothScrollTo } from '../utils/smoothScroll';
import { createSimpleScrollSpy } from '../utils/simpleScrollSpy';

const Navbar = () => {
  const { configuration } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const navigation = configuration?.navigation || [
    { name: 'Home', href: '/', visible: true },
    { name: 'About', href: '#about', visible: true },
    { name: 'Projects', href: '#projects', visible: true },
    { name: 'Skills', href: '#skills', visible: true },
    { name: 'Certificates', href: '#certificates', visible: true },
    { name: 'Contact', href: '#contact', visible: true },
  ];

  // Set up scroll spy for active navigation highlighting
  useEffect(() => {
    const sections = ['about', 'projects', 'skills', 'certificates', 'contact'];
    
    // Debug: Check if sections exist
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      console.log(`Section ${sectionId}:`, element ? 'Found' : 'Not found');
    });
    
    const cleanup = createSimpleScrollSpy(sections, (sectionId) => {
      console.log('Active section changed to:', sectionId);
      setActiveSection(sectionId);
    }, { offset: 100 });

    return cleanup;
  }, []);

  const scrollToSection = (href) => {
    if (href === '/') {
      // Scroll to top for home
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setActiveSection('');
    } else if (href.startsWith('#')) {
      const sectionId = href.substring(1);
      smoothScrollTo(sectionId, 80); // 80px offset for navbar height
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-max">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            {configuration?.branding?.icon ? (
              <img
                src={configuration.branding.icon}
                alt="Icon"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center ${configuration?.branding?.icon ? 'hidden' : ''}`}>
              <span className="text-white font-bold text-sm">
                {(configuration?.siteInfo?.name || 'Y').charAt(0)}
              </span>
            </div>
            <span className="text-xl font-bold text-gray-900">{configuration?.siteInfo?.name || 'Your Name'}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.filter(item => item.visible).map((item) => {
              const isActive = item.href === '/' 
                ? activeSection === '' 
                : activeSection === item.href.substring(1);
              
              return item.href === '/' ? (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className={`font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className={`font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.filter(item => item.visible).map((item) => {
                const isActive = item.href === '/' 
                  ? activeSection === '' 
                  : activeSection === item.href.substring(1);
                
                return item.href === '/' ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;



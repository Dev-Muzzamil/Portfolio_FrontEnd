import React from 'react';
import { 
  FaJs, FaReact, FaNodeJs, FaPython, FaJava, FaHtml5, FaCss3Alt, FaGithub, FaDocker, FaAws,
  FaDatabase, FaCloud, FaMobile,
  FaWindows, FaApple, FaLinux, FaUbuntu, FaCentos, FaRedhat, FaFedora,
  FaVuejs, FaAngular, FaNpm, FaYarn,
  FaGitlab, FaBitbucket, FaTrello, FaSlack, FaDiscord, FaSkype, FaWhatsapp, FaTelegram,
  FaPhp, FaWordpress, FaDrupal, FaJoomla, FaMagento, FaShopify,
  FaFigma, FaSketch,
  FaMicrosoft,
  FaMarkdown, FaFile
} from 'react-icons/fa';

const TechnologyIcon = ({ technology, className = "w-4 h-4" }) => {
  // Function to get icon based on technology name patterns
  const getIconForTechnology = (tech) => {
    const lowerTech = tech.toLowerCase();
    
    // JavaScript/TypeScript
    if (lowerTech.includes('javascript') || lowerTech.includes('js') || lowerTech.includes('typescript') || lowerTech.includes('ts')) {
      return FaJs;
    }
    
    // React ecosystem
    if (lowerTech.includes('react') || lowerTech.includes('next') || lowerTech.includes('gatsby') || lowerTech.includes('remix')) {
      return FaReact;
    }
    
    // Vue ecosystem
    if (lowerTech.includes('vue') || lowerTech.includes('nuxt')) {
      return FaVuejs;
    }
    
    // Angular
    if (lowerTech.includes('angular')) {
      return FaAngular;
    }
    
    // Node.js
    if (lowerTech.includes('node') || lowerTech.includes('express')) {
      return FaNodeJs;
    }
    
    // Python
    if (lowerTech.includes('python') || lowerTech.includes('django') || lowerTech.includes('flask') || lowerTech.includes('fastapi')) {
      return FaPython;
    }
    
    // Java
    if (lowerTech.includes('java') || lowerTech.includes('spring')) {
      return FaJava;
    }
    
    // PHP
    if (lowerTech.includes('php') || lowerTech.includes('laravel')) {
      return FaPhp;
    }
    
    // HTML
    if (lowerTech.includes('html')) {
      return FaHtml5;
    }
    
    // CSS
    if (lowerTech.includes('css') || lowerTech.includes('tailwind') || lowerTech.includes('bootstrap') || lowerTech.includes('sass')) {
      return FaCss3Alt;
    }
    
    // Database
    if (lowerTech.includes('mongo') || lowerTech.includes('mysql') || lowerTech.includes('postgres') || lowerTech.includes('sqlite') || lowerTech.includes('redis')) {
      return FaDatabase;
    }
    
    // Cloud services
    if (lowerTech.includes('aws') || lowerTech.includes('amazon')) {
      return FaAws;
    }
    if (lowerTech.includes('docker') || lowerTech.includes('kubernetes')) {
      return FaDocker;
    }
    if (lowerTech.includes('firebase') || lowerTech.includes('supabase') || lowerTech.includes('netlify') || lowerTech.includes('vercel') || lowerTech.includes('heroku') || lowerTech.includes('webpack') || lowerTech.includes('jest') || lowerTech.includes('cypress') || lowerTech.includes('selenium') || lowerTech.includes('eslint') || lowerTech.includes('prettier') || lowerTech.includes('adobe') || lowerTech.includes('canva') || lowerTech.includes('postman') || lowerTech.includes('insomnia') || lowerTech.includes('debian') || lowerTech.includes('json') || lowerTech.includes('nginx') || lowerTech.includes('apache') || lowerTech.includes('elasticsearch') || lowerTech.includes('graphql') || lowerTech.includes('bruno') || lowerTech.includes('vultr') || lowerTech.includes('ibm') || lowerTech.includes('railway')) {
      return FaCloud;
    }
    if (lowerTech.includes('digitalocean')) {
      return FaCloud;
    }
    
    // Version control
    if (lowerTech.includes('git') || lowerTech.includes('github')) {
      return FaGithub;
    }
    if (lowerTech.includes('gitlab')) {
      return FaGitlab;
    }
    if (lowerTech.includes('bitbucket')) {
      return FaBitbucket;
    }
    
    // Build tools
    if (lowerTech.includes('npm')) {
      return FaNpm;
    }
    if (lowerTech.includes('yarn')) {
      return FaYarn;
    }
    
    // Design tools
    if (lowerTech.includes('figma')) {
      return FaFigma;
    }
    if (lowerTech.includes('sketch')) {
      return FaSketch;
    }
    
    // Communication
    if (lowerTech.includes('slack')) {
      return FaSlack;
    }
    if (lowerTech.includes('discord')) {
      return FaDiscord;
    }
    if (lowerTech.includes('teams') || lowerTech.includes('microsoft')) {
      return FaMicrosoft;
    }
    if (lowerTech.includes('skype')) {
      return FaSkype;
    }
    if (lowerTech.includes('telegram')) {
      return FaTelegram;
    }
    if (lowerTech.includes('whatsapp')) {
      return FaWhatsapp;
    }
    
    // Project management
    if (lowerTech.includes('trello')) {
      return FaTrello;
    }
    
    // E-commerce
    if (lowerTech.includes('shopify')) {
      return FaShopify;
    }
    if (lowerTech.includes('magento')) {
      return FaMagento;
    }
    if (lowerTech.includes('wordpress')) {
      return FaWordpress;
    }
    if (lowerTech.includes('drupal')) {
      return FaDrupal;
    }
    if (lowerTech.includes('joomla')) {
      return FaJoomla;
    }
    
    // Operating systems
    if (lowerTech.includes('ubuntu')) {
      return FaUbuntu;
    }
    if (lowerTech.includes('centos')) {
      return FaCentos;
    }
    if (lowerTech.includes('redhat')) {
      return FaRedhat;
    }
    if (lowerTech.includes('fedora')) {
      return FaFedora;
    }
    if (lowerTech.includes('windows')) {
      return FaWindows;
    }
    if (lowerTech.includes('mac') || lowerTech.includes('macos')) {
      return FaApple;
    }
    if (lowerTech.includes('linux')) {
      return FaLinux;
    }
    
    // Mobile
    if (lowerTech.includes('mobile') || lowerTech.includes('android') || lowerTech.includes('flutter')) {
      return FaMobile;
    }
    if (lowerTech.includes('ios') || lowerTech.includes('swift')) {
      return FaApple;
    }
    
    // Data formats
    if (lowerTech.includes('markdown') || lowerTech.includes('md')) {
      return FaMarkdown;
    }
    if (lowerTech.includes('csv') || lowerTech.includes('file')) {
      return FaFile;
    }
    
    // Default fallback
    return null;
  };

  const IconComponent = getIconForTechnology(technology);
  
  if (!IconComponent) {
    // Return a default icon for unknown technologies
    return (
      <div className={`${className} rounded bg-gray-200 flex items-center justify-center`}>
        <span className="text-xs font-bold text-gray-600">
          {technology.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return <IconComponent className={className} />;
};

export default TechnologyIcon;
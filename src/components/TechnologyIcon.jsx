import React from 'react';
import {
  SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiNodedotjs, SiExpress, SiPython, SiDjango, SiFlask, SiFastapi,
  SiSpring, SiPhp, SiLaravel, SiHtml5, SiCss3, SiTailwindcss, SiBootstrap, SiSass,
  SiMongodb, SiMysql, SiPostgresql, SiSqlite, SiRedis,
  SiAmazonaws, SiDocker, SiKubernetes, SiFirebase, SiSupabase, SiNetlify, SiVercel, SiHeroku, SiDigitalocean,
  SiGit, SiGithub, SiGitlab, SiBitbucket, SiNpm, SiYarn, SiPnpm,
  SiFigma, SiSketch, SiAdobephotoshop, SiAdobeillustrator, SiCanva,
  SiSlack, SiDiscord, SiMicrosoftteams, SiSkype, SiTelegram, SiWhatsapp,
  SiTrello, SiJira, SiNotion, SiAsana,
  SiShopify, SiMagento, SiWordpress, SiWoocommerce,
  SiUbuntu, SiCentos, SiRedhat, SiFedora, SiWindows, SiApple, SiLinux, SiAndroid, SiIos,
  SiVuedotjs, SiAngular, SiSvelte, SiNuxtdotjs,
  SiWebpack, SiVite, SiEslint, SiPrettier, SiJest, SiCypress, SiSelenium,
  SiGraphql, SiPostman, SiInsomnia,
  SiNginx, SiApache, SiElasticsearch,
  SiMarkdown, SiJsonwebtokens
} from 'react-icons/si';
import { FaJava, FaDatabase, FaCloud, FaMobile, FaFile } from 'react-icons/fa';

const TechnologyIcon = ({ technology, className = "w-4 h-4" }) => {
  // Function to get icon and color based on technology name patterns
  const getIconForTechnology = (tech) => {
    const lowerTech = tech.toLowerCase();

    // JavaScript/TypeScript
    if (lowerTech.includes('typescript') || lowerTech === 'ts') {
      return { icon: SiTypescript, color: '#3178C6' };
    }
    if (lowerTech.includes('javascript') || lowerTech === 'js') {
      return { icon: SiJavascript, color: '#F7DF1E' };
    }

    // React ecosystem
    if (lowerTech.includes('next')) {
      return { icon: SiNextdotjs, color: '#000000' };
    }
    if (lowerTech.includes('react')) {
      return { icon: SiReact, color: '#61DAFB' };
    }

    // Vue ecosystem
    if (lowerTech.includes('nuxt')) {
      return { icon: SiNuxtdotjs, color: '#00DC82' };
    }
    if (lowerTech.includes('vue')) {
      return { icon: SiVuedotjs, color: '#4FC08D' };
    }

    // Angular & Svelte
    if (lowerTech.includes('angular')) {
      return { icon: SiAngular, color: '#DD0031' };
    }
    if (lowerTech.includes('svelte')) {
      return { icon: SiSvelte, color: '#FF3E00' };
    }

    // Node.js
    if (lowerTech.includes('express')) {
      return { icon: SiExpress, color: '#000000' };
    }
    if (lowerTech.includes('node')) {
      return { icon: SiNodedotjs, color: '#339933' };
    }

    // Python
    if (lowerTech.includes('django')) {
      return { icon: SiDjango, color: '#092E20' };
    }
    if (lowerTech.includes('flask')) {
      return { icon: SiFlask, color: '#000000' };
    }
    if (lowerTech.includes('fastapi')) {
      return { icon: SiFastapi, color: '#009688' };
    }
    if (lowerTech.includes('python')) {
      return { icon: SiPython, color: '#3776AB' };
    }

    // Java
    if (lowerTech.includes('spring')) {
      return { icon: SiSpring, color: '#6DB33F' };
    }
    if (lowerTech.includes('java')) {
      return { icon: FaJava, color: '#007396' };
    }

    // PHP
    if (lowerTech.includes('laravel')) {
      return { icon: SiLaravel, color: '#FF2D20' };
    }
    if (lowerTech.includes('php')) {
      return { icon: SiPhp, color: '#777BB4' };
    }

    // HTML/CSS
    if (lowerTech.includes('html')) {
      return { icon: SiHtml5, color: '#E34F26' };
    }
    if (lowerTech.includes('tailwind')) {
      return { icon: SiTailwindcss, color: '#06B6D4' };
    }
    if (lowerTech.includes('bootstrap')) {
      return { icon: SiBootstrap, color: '#7952B3' };
    }
    if (lowerTech.includes('sass') || lowerTech.includes('scss')) {
      return { icon: SiSass, color: '#CC6699' };
    }
    if (lowerTech.includes('css')) {
      return { icon: SiCss3, color: '#1572B6' };
    }

    // Databases
    if (lowerTech.includes('mongo')) {
      return { icon: SiMongodb, color: '#47A248' };
    }
    if (lowerTech.includes('mysql')) {
      return { icon: SiMysql, color: '#4479A1' };
    }
    if (lowerTech.includes('postgres')) {
      return { icon: SiPostgresql, color: '#4169E1' };
    }
    if (lowerTech.includes('sqlite')) {
      return { icon: SiSqlite, color: '#003B57' };
    }
    if (lowerTech.includes('redis')) {
      return { icon: SiRedis, color: '#DC382D' };
    }

    // Cloud & DevOps
    if (lowerTech.includes('aws') || lowerTech.includes('amazon')) {
      return { icon: SiAmazonaws, color: '#FF9900' };
    }
    if (lowerTech.includes('kubernetes')) {
      return { icon: SiKubernetes, color: '#326CE5' };
    }
    if (lowerTech.includes('docker')) {
      return { icon: SiDocker, color: '#2496ED' };
    }
    if (lowerTech.includes('firebase')) {
      return { icon: SiFirebase, color: '#FFCA28' };
    }
    if (lowerTech.includes('supabase')) {
      return { icon: SiSupabase, color: '#3ECF8E' };
    }
    if (lowerTech.includes('netlify')) {
      return { icon: SiNetlify, color: '#00C7B7' };
    }
    if (lowerTech.includes('vercel')) {
      return { icon: SiVercel, color: '#000000' };
    }
    if (lowerTech.includes('heroku')) {
      return { icon: SiHeroku, color: '#430098' };
    }
    if (lowerTech.includes('digitalocean')) {
      return { icon: SiDigitalocean, color: '#0080FF' };
    }

    // Build tools & Testing
    if (lowerTech.includes('webpack')) {
      return { icon: SiWebpack, color: '#8DD6F9' };
    }
    if (lowerTech.includes('vite')) {
      return { icon: SiVite, color: '#646CFF' };
    }
    if (lowerTech.includes('eslint')) {
      return { icon: SiEslint, color: '#4B32C3' };
    }
    if (lowerTech.includes('prettier')) {
      return { icon: SiPrettier, color: '#F7B93E' };
    }
    if (lowerTech.includes('jest')) {
      return { icon: SiJest, color: '#C21325' };
    }
    if (lowerTech.includes('cypress')) {
      return { icon: SiCypress, color: '#17202C' };
    }
    if (lowerTech.includes('selenium')) {
      return { icon: SiSelenium, color: '#43B02A' };
    }

    // APIs & Tools
    if (lowerTech.includes('graphql')) {
      return { icon: SiGraphql, color: '#E10098' };
    }
    if (lowerTech.includes('postman')) {
      return { icon: SiPostman, color: '#FF6C37' };
    }
    if (lowerTech.includes('insomnia')) {
      return { icon: SiInsomnia, color: '#4000BF' };
    }

    // Web servers
    if (lowerTech.includes('nginx')) {
      return { icon: SiNginx, color: '#009639' };
    }
    if (lowerTech.includes('apache')) {
      return { icon: SiApache, color: '#D22128' };
    }
    if (lowerTech.includes('elasticsearch')) {
      return { icon: SiElasticsearch, color: '#005571' };
    }

    // Version control
    if (lowerTech.includes('github')) {
      return { icon: SiGithub, color: '#181717' };
    }
    if (lowerTech.includes('gitlab')) {
      return { icon: SiGitlab, color: '#FC6D26' };
    }
    if (lowerTech.includes('bitbucket')) {
      return { icon: SiBitbucket, color: '#0052CC' };
    }
    if (lowerTech.includes('git')) {
      return { icon: SiGit, color: '#F05032' };
    }

    // Package managers
    if (lowerTech.includes('pnpm')) {
      return { icon: SiPnpm, color: '#F69220' };
    }
    if (lowerTech.includes('yarn')) {
      return { icon: SiYarn, color: '#2C8EBB' };
    }
    if (lowerTech.includes('npm')) {
      return { icon: SiNpm, color: '#CB3837' };
    }

    // Design tools
    if (lowerTech.includes('figma')) {
      return { icon: SiFigma, color: '#F24E1E' };
    }
    if (lowerTech.includes('sketch')) {
      return { icon: SiSketch, color: '#F7B500' };
    }
    if (lowerTech.includes('photoshop')) {
      return { icon: SiAdobephotoshop, color: '#31A8FF' };
    }
    if (lowerTech.includes('illustrator')) {
      return { icon: SiAdobeillustrator, color: '#FF9A00' };
    }
    if (lowerTech.includes('canva')) {
      return { icon: SiCanva, color: '#00C4CC' };
    }

    // Communication
    if (lowerTech.includes('slack')) {
      return { icon: SiSlack, color: '#4A154B' };
    }
    if (lowerTech.includes('discord')) {
      return { icon: SiDiscord, color: '#5865F2' };
    }
    if (lowerTech.includes('teams')) {
      return { icon: SiMicrosoftteams, color: '#6264A7' };
    }
    if (lowerTech.includes('skype')) {
      return { icon: SiSkype, color: '#00AFF0' };
    }
    if (lowerTech.includes('telegram')) {
      return { icon: SiTelegram, color: '#26A5E4' };
    }
    if (lowerTech.includes('whatsapp')) {
      return { icon: SiWhatsapp, color: '#25D366' };
    }

    // Project management
    if (lowerTech.includes('trello')) {
      return { icon: SiTrello, color: '#0052CC' };
    }
    if (lowerTech.includes('jira')) {
      return { icon: SiJira, color: '#0052CC' };
    }
    if (lowerTech.includes('notion')) {
      return { icon: SiNotion, color: '#000000' };
    }
    if (lowerTech.includes('asana')) {
      return { icon: SiAsana, color: '#F06A6A' };
    }

    // E-commerce
    if (lowerTech.includes('shopify')) {
      return { icon: SiShopify, color: '#7AB55C' };
    }
    if (lowerTech.includes('magento')) {
      return { icon: SiMagento, color: '#EE672F' };
    }
    if (lowerTech.includes('woocommerce')) {
      return { icon: SiWoocommerce, color: '#96588A' };
    }
    if (lowerTech.includes('wordpress')) {
      return { icon: SiWordpress, color: '#21759B' };
    }

    // Operating systems
    if (lowerTech.includes('ubuntu')) {
      return { icon: SiUbuntu, color: '#E95420' };
    }
    if (lowerTech.includes('centos')) {
      return { icon: SiCentos, color: '#262577' };
    }
    if (lowerTech.includes('redhat')) {
      return { icon: SiRedhat, color: '#EE0000' };
    }
    if (lowerTech.includes('fedora')) {
      return { icon: SiFedora, color: '#51A2DA' };
    }
    if (lowerTech.includes('windows')) {
      return { icon: SiWindows, color: '#0078D6' };
    }
    if (lowerTech.includes('macos') || lowerTech.includes('mac') || lowerTech.includes('ios')) {
      return { icon: SiApple, color: '#000000' };
    }
    if (lowerTech.includes('android')) {
      return { icon: SiAndroid, color: '#3DDC84' };
    }
    if (lowerTech.includes('linux')) {
      return { icon: SiLinux, color: '#FCC624' };
    }

    // Data formats & Other
    if (lowerTech.includes('markdown') || lowerTech.includes('md')) {
      return { icon: SiMarkdown, color: '#000000' };
    }
    if (lowerTech.includes('jwt') || lowerTech.includes('json')) {
      return { icon: SiJsonwebtokens, color: '#000000' };
    }
    
    // Generic fallbacks for categories
    if (lowerTech.includes('database') || lowerTech.includes('sql')) {
      return { icon: FaDatabase, color: '#336791' };
    }
    if (lowerTech.includes('cloud') || lowerTech.includes('server')) {
      return { icon: FaCloud, color: '#0080FF' };
    }
    if (lowerTech.includes('mobile') || lowerTech.includes('app')) {
      return { icon: FaMobile, color: '#888888' };
    }

    // Default fallback
    return null;
  };

  const iconData = getIconForTechnology(technology);

  if (!iconData) {
    // Return a default icon for unknown technologies
    return (
      <div className={`${className} rounded bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center`}>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {technology.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  const IconComponent = iconData.icon;
  return <IconComponent className={className} style={{ color: iconData.color }} />;
};

export default TechnologyIcon;
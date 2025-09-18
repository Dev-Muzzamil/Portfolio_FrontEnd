import { useEffect } from 'react';
import { useData } from '../contexts/DataContext';

const Head = () => {
  const { configuration, about } = useData();

  useEffect(() => {
    // Update page title
    const siteName = configuration?.siteInfo?.name || about?.name || 'Your Name';
    const siteTitle = configuration?.siteInfo?.title || about?.title || 'Portfolio';
    document.title = `${siteName} - ${siteTitle}`;

    // Update favicon
    if (configuration?.branding?.logo) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());

      // Add new favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = configuration.branding.logo;
      document.head.appendChild(favicon);

      // Add apple-touch-icon
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = configuration.branding.logo;
      document.head.appendChild(appleTouchIcon);
    }

    // Update meta description
    const description = configuration?.seo?.description || 
                      configuration?.siteInfo?.shortBio || 
                      about?.shortBio || 
                      'Professional portfolio';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `${siteName} - ${siteTitle}`);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && configuration?.seo?.ogImage) {
      ogImage.setAttribute('content', configuration.seo.ogImage);
    }

    // Update Twitter meta tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', `${siteName} - ${siteTitle}`);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }

  }, [configuration, about]);

  return null; // This component doesn't render anything
};

export default Head;

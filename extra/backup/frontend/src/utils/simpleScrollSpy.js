// Simple and reliable scroll spy implementation
export const createSimpleScrollSpy = (sections, callback, options = {}) => {
  const {
    offset = 100,
    throttle = 16
  } = options;

  let ticking = false;
  let currentSection = '';

  const updateActiveSection = () => {
    const scrollTop = window.pageYOffset;
    
    // Check if we're at the top
    if (scrollTop < offset) {
      if (currentSection !== '') {
        currentSection = '';
        callback('');
      }
      return;
    }

    // Find the current section
    let newSection = '';
    let minDistance = Infinity;

    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementBottom = elementTop + rect.height;
        
        // Check if section is in view
        if (scrollTop >= elementTop - offset && scrollTop < elementBottom - offset) {
          const distance = Math.abs(scrollTop - (elementTop - offset));
          if (distance < minDistance) {
            minDistance = distance;
            newSection = sectionId;
          }
        }
      }
    });

    if (newSection !== currentSection) {
      currentSection = newSection;
      callback(newSection);
    }
  };

  const throttledUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  };

  // Initial check
  setTimeout(updateActiveSection, 100);

  // Listen for scroll events
  window.addEventListener('scroll', throttledUpdate, { passive: true });

  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', throttledUpdate);
  };
};

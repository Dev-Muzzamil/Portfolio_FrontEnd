// Smooth scroll to element with easing
export const smoothScrollTo = (elementId, offset = 0) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

// Smooth scroll to top
export const smoothScrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// Enhanced scroll with animation
export const animatedScrollTo = (elementId, offset = 0, duration = 1000) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startPosition = window.pageYOffset;
  const elementPosition = element.getBoundingClientRect().top;
  const targetPosition = elementPosition + window.pageYOffset - offset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Easing function (ease-in-out)
    const ease = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    window.scrollTo(0, startPosition + distance * ease);
    
    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

// Scroll spy for navigation highlighting
export const createScrollSpy = (sections, callback) => {
  const observer = new IntersectionObserver(
    (entries) => {
      // Find the entry with the highest intersection ratio
      let mostVisible = null;
      let highestRatio = 0;

      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
          highestRatio = entry.intersectionRatio;
          mostVisible = entry.target;
        }
      });

      if (mostVisible) {
        console.log('Scroll spy detected:', mostVisible.id, 'with ratio:', highestRatio);
        callback(mostVisible.id);
      }
    },
    {
      threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
      rootMargin: '-100px 0px -10% 0px' // Account for navbar height and some margin
    }
  );

  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        console.log('Observing section:', sectionId);
        observer.observe(element);
      } else {
        console.warn('Section not found:', sectionId);
      }
    });
  }, 100);

  return observer;
};

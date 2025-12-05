import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Scroll to top on initial page load
    window.scrollTo(0, 0);
    
    // Also ensure it's at top after a short delay (for any async content)
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default PageScrollToTop;

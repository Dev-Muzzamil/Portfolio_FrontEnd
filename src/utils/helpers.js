// Get API base URL with fallback to current origin
export const getApiBaseUrl = () => {
  // Prefer explicit env var set at build time
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, '');

  // Fallback to window origin if available (useful in dev or when env not present)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }

  // Last resort: http://localhost:5000 (common default for backend)
  return 'http://localhost:5000';
};

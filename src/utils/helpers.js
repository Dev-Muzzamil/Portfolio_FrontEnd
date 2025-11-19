// Helper functions for the frontend
export const getApiBaseUrl = () => {
  // In production, this would be the actual API URL
  // For development, it uses the relative path
  return window.location.origin;
};
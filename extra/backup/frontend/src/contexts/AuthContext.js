import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Clear tokens and logout
  const clearTokensAndLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setLoading(false);
    console.log('🔒 Logout: Tokens cleared and user logged out');
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/v1/auth/refresh', { 
        refreshToken: refreshTokenValue 
      });
      
      const { token, user: userData } = response.data;
      
      // Update stored token
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('🔄 Token refreshed successfully');
      setUser(userData);
      return true;
    } catch (error) {
      console.log('❌ Token refresh failed:', error.message);
      clearTokensAndLogout();
      return false;
    }
  }, [clearTokensAndLogout]);

  // Fetch user function
  const fetchUser = useCallback(async () => {
    try {
      console.log('🔍 Fetching user data...');
      const response = await axios.get('/api/v1/auth/me');
      console.log('✅ User data fetched successfully:', response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.log('❌ Error fetching user:', error.response?.status, error.message);
      
      // If 401, try to refresh token
      if (error.response?.status === 401) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          // Refresh failed, user needs to login again
          return;
        }
      } else {
        // For network errors, just set loading to false
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  // Initial auth check - run only once
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  // Login function
  const login = async (email, password) => {
    console.log('🔐 Login attempt started for:', email);
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password });
      const { token, refreshToken, user: userData } = response.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('✅ Login successful, setting token and user');
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearTokensAndLogout();
    console.log('🔒 Manual logout: User logged out and tokens cleared');
  };

  // Upload session management - simplified
  const startUploadSession = useCallback(() => {
    console.log('🚀 Starting upload session');
    setIsUploading(true);
  }, []);

  const endUploadSession = useCallback(() => {
    console.log('🏁 Ending upload session');
    setIsUploading(false);
  }, []);

  // Legacy function for compatibility
  const resetInactivityForUpload = useCallback(() => {
    console.log('🔄 Upload activity detected');
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    showInactivityWarning: false, // Always false - no auto-logout
    dismissWarning: () => {}, // No-op function
    resetInactivityForUpload,
    startUploadSession,
    endUploadSession,
    isUploading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
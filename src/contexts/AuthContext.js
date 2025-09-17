import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout

  // Axios base URL is already set in axiosConfig.js

  // Clear tokens and logout
  const clearTokensAndLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setLoading(false);
    console.log('🔒 Auto-logout: Tokens cleared and user logged out');
  };

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    if (user) {
      // Hide warning if it was showing
      setShowInactivityWarning(false);
      
      // Set warning timer (5 minutes before logout)
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
        console.log('⚠️ Inactivity warning: 5 minutes until auto-logout');
      }, INACTIVITY_TIMEOUT - WARNING_TIME);
      
      // Set logout timer
      inactivityTimerRef.current = setTimeout(() => {
        console.log('⏰ Inactivity timeout reached - logging out user');
        clearTokensAndLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, INACTIVITY_TIMEOUT]);

  // Handle user activity
  const handleUserActivity = useCallback(() => {
    if (user) {
      resetInactivityTimer();
    }
  }, [user, resetInactivityTimer]);

  // Reset inactivity timer during uploads (exported for use in upload components)
  const resetInactivityForUpload = useCallback(() => {
    if (user) {
      resetInactivityTimer();
      console.log('🔄 Upload activity detected - inactivity timer reset');
    }
  }, [user, resetInactivityTimer]);

  // Fetch user function
  const fetchUser = async () => {
    try {
      console.log('🔍 Fetching user data...');
      const response = await axios.get('/api/auth/me');
      console.log('✅ User data fetched successfully:', response.data.user);
      setUser(response.data.user);
      // Start inactivity timer after successful login
      resetInactivityTimer();
    } catch (error) {
      console.log('❌ Error fetching user:', error.response?.status, error.message);
      // Only clear tokens if it's an auth error, not a network error
      if (error.response?.status === 401) {
        clearTokensAndLogout();
      } else {
        // For network errors, just set loading to false
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial auth check effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]); // Include fetchUser dependency

  // Activity listeners effect
  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Set up beforeunload listener to clear tokens when window is closed
    const handleBeforeUnload = () => {
      clearTokensAndLogout();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleUserActivity]); // Only re-run when handleUserActivity changes

  const login = async (email, password) => {
    console.log('🔐 Login attempt started for:', email);
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      console.log('✅ Login successful, setting token and user');
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Start inactivity timer after successful login
      resetInactivityTimer();
      
      return { success: true };
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Clear tokens and logout
    clearTokensAndLogout();
    setShowInactivityWarning(false);
    console.log('🔒 Manual logout: User logged out and tokens cleared');
  };

  // Dismiss warning and extend session
  const dismissWarning = () => {
    setShowInactivityWarning(false);
    resetInactivityTimer();
    console.log('✅ Inactivity warning dismissed - session extended');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    showInactivityWarning,
    dismissWarning,
    resetInactivityForUpload
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



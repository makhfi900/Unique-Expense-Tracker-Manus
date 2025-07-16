import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createCachedApiClient, warmCache } from '../utils/apiCache';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions/api' 
  : 'http://localhost:3001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Create cached API client instance
  const cachedApiClient = useMemo(() => {
    return createCachedApiClient((endpoint, options = {}) => {
      return rawApiCall(endpoint, options);
    });
  }, [token]); // Recreate when token changes

  useEffect(() => {
    if (token) {
      // Verify token validity on app load
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Token is valid, decode user info from token
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          role: payload.role,
        });
      } else {
        // Token is invalid
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        
        // Warm cache with commonly used data
        setTimeout(() => {
          warmCache(cachedApiClient, ['/categories', '/users']);
        }, 100);
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    
    // Clear cache on logout
    cachedApiClient.clear();
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Raw API call without caching (for internal use)
  const rawApiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Cached API call (exposed to components)
  const apiCall = async (endpoint, options = {}) => {
    return cachedApiClient.call(endpoint, options);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    apiCall,
    isAdmin: user?.role === 'admin',
    isAccountOfficer: user?.role === 'account_officer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


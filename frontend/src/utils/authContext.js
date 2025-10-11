import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('nutri_user');
        const savedToken = localStorage.getItem('nutri_token');
        
        if (savedUser && savedToken) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setToken(savedToken);
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('nutri_user');
        localStorage.removeItem('nutri_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData, authToken) => {
    try {
      setUser(userData);
      setToken(authToken);
      
      // Save to localStorage
      localStorage.setItem('nutri_user', JSON.stringify(userData));
      localStorage.setItem('nutri_token', authToken);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Logout function
  const logout = () => {
    try {
      setUser(null);
      setToken(null);
      
      // Clear localStorage
      localStorage.removeItem('nutri_user');
      localStorage.removeItem('nutri_token');
      
      // Remove axios default header
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Update user data
  const updateUser = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('nutri_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  // Axios interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    token,
    loading,
    isAdmin,
    login,
    logout,
    updateUser,
    setUser: updateUser
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

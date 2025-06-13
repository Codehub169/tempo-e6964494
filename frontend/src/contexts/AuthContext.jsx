import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
// import { socketService } from '../services/socketService'; // socketService connect/disconnect is handled by ChatRoomPage

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading state for auth check
  const [authError, setAuthError] = useState(null); // Renamed from error to authError for clarity

  const initializeAuth = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        // socketService.connect(token); // Connect socket is handled by ChatRoomPage for specific chat
      } else {
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
        // socketService.disconnect();
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setUser(null);
      localStorage.removeItem('authToken');
      delete apiClient.defaults.headers.common['Authorization'];
      // socketService.disconnect();
      setAuthError(err.response?.data?.detail || err.message || 'Session expired or invalid.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('authToken', data.access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      // socketService.connect(data.access_token); // Connect socket is handled by ChatRoomPage
      return currentUser;
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Login failed. Please check credentials.';
      setAuthError(errorMsg);
      localStorage.removeItem('authToken'); 
      delete apiClient.defaults.headers.common['Authorization'];
      setUser(null);
      // socketService.disconnect();
      throw new Error(errorMsg); // Re-throw for form to catch
    }
  };

  const signup = async (userData) => {
    setAuthError(null);
    try {
      const createdUser = await authService.signup(userData);
      alert('Signup successful! Please log in.'); 
      return createdUser; 
    } catch (err) {
      console.error('Signup error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Signup failed. Please try again.';
      setAuthError(errorMsg);
      throw new Error(errorMsg); 
    } 
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    // socketService.disconnect(); // Disconnect is handled by ChatRoomPage or if socketService manages global connection state
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading, error: authError, setError: setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

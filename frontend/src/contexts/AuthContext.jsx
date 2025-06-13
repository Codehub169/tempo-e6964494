import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import socketService from '../services/socketService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          socketService.connect(token);
        } else {
          setUser(null);
          delete apiClient.defaults.headers.common['Authorization'];
          socketService.disconnect();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
        localStorage.removeItem('authToken');
        delete apiClient.defaults.headers.common['Authorization'];
        socketService.disconnect();
        // Optionally set an error state to display to the user
        // setError(err.message || 'Failed to initialize session');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      // Cleanup if necessary, e.g., socket disconnection on context unmount
      // socketService.disconnect(); // This might be too aggressive if app re-renders often
    };
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('authToken', data.access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      socketService.connect(data.access_token);
      return currentUser;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signup(userData);
      localStorage.setItem('authToken', data.access_token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
      const currentUser = await authService.getCurrentUser(); // Or use data.user if returned by signup
      setUser(currentUser);
      socketService.connect(data.access_token);
      return currentUser;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.detail || err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    socketService.disconnect();
    // Optionally, could call a backend /logout endpoint if it exists
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

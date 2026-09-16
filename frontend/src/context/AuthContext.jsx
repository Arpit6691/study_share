import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup axios default config with automatic production Render backend fallback
  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://study-share-54d7.onrender.com/api';
    }
    return 'http://localhost:5000/api';
  };
  
  axios.defaults.baseURL = getApiUrl();

  // Request interceptor to automatically attach authorization token if present
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  }, (error) => Promise.reject(error));

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Auth verification failed', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    
    // If user is verified, log them in
    if (!res.data.requiresVerification) {
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data);
    }
    
    return res.data;
  };

  const register = async (name, username, email, password) => {
    const res = await axios.post('/auth/signup', { name, username, email, password });
    // Registration now requires verification, so we don't log them in yet
    return res.data;
  };

  const verifyOTP = async (email, otp) => {
    const res = await axios.post('/auth/verify-otp', { email, otp });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data);
    return res.data;
  };

  const resendOTP = async (email) => {
    const res = await axios.post('/auth/resend-otp', { email });
    return res.data;
  };

  const googleLogin = async (token) => {
    const res = await axios.post('/auth/google', { token });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUploadCount = () => {
    if (user) {
      setUser({ ...user, uploadCount: user.uploadCount + 1, score: user.score + 10 });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      verifyOTP, 
      resendOTP, 
      googleLogin, 
      logout, 
      updateUploadCount 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

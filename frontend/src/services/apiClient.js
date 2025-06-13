import axios from 'axios';

// Determine the base URL based on the environment
// For development, it will be http://localhost:9000 (or your backend port)
// For production, it will be the domain where your app is hosted (e.g., /api if frontend and backend are on the same domain)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle token refresh or redirect on 401/403 errors if needed
apiClient.interceptors.response.use(
  response => response,
  error => {
    // if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    //   // For example, redirect to login or attempt token refresh
    //   // localStorage.removeItem('authToken');
    //   // window.location.href = '/login';
    //   console.error('Authentication error:', error.response.data);
    // }
    // It's generally better to handle auth errors in AuthContext or specific service calls
    return Promise.reject(error);
  }
);

export default apiClient;

import apiClient from './apiClient';

const authService = {
  login: async (credentials) => {
    // FastAPI's OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // 'username' is the default field for email in OAuth2PasswordRequestForm
    formData.append('password', credentials.password);

    try {
      const response = await apiClient.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data; // Should contain access_token and token_type
    } catch (error) {
      console.error('Login error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  signup: async (userData) => {
    // userData should be { email, password, full_name }
    try {
      // The backend /auth/signup endpoint expects JSON
      const response = await apiClient.post('/auth/signup', userData);
      // Assuming signup also returns a token directly or user info + token
      // For this setup, we expect it to return { access_token, user (optional) }
      // If it only returns user, then login might need to be called after signup
      // Based on the plan, we'll assume it returns a token similar to login
      return response.data; 
    } catch (error) {
      console.error('Signup error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data; // User object
    } catch (error) {
      console.error('Get current user error:', error.response ? error.response.data : error.message);
      // This might happen if the token is invalid/expired
      // AuthContext will handle removing the token and logging out
      throw error;
    }
  },

  // Optional: Add a logout function if the backend has a logout endpoint
  // logout: async () => {
  //   try {
  //     await apiClient.post('/auth/logout');
  //   } catch (error) {
  //     console.error('Logout error:', error.response ? error.response.data : error.message);
  //     // Even if backend logout fails, client-side logout should proceed
  //     throw error;
  //   }
  // },
};

export default authService;

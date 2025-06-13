import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirection after auth

// AuthForm component: Handles both login and signup forms.
// Allows users to switch between login and signup views.
function AuthForm() {
  // State to toggle between 'login' and 'signup' forms
  const [isLogin, setIsLogin] = useState(true);
  // State for form input fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State for loading/authentication status
  const [isLoading, setIsLoading] = useState(false);
  // State for error messages
  const [error, setError] = useState('');

  const navigate = useNavigate(); // Hook for programmatic navigation

  // Handles form submission for both login and signup
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    // In a real app, you would call your authService here
    console.log('Form submitted:', { isLogin, fullName: isLogin ? undefined : fullName, email, password });
    
    // Simulate API delay and response
    setTimeout(() => {
      setIsLoading(false);
      // Simulate successful authentication
      // TODO: Replace with actual API call and error handling
      if (email && password) { // Basic validation for demo
        // Store token (dummy) and navigate to dashboard
        localStorage.setItem('authToken', 'dummy_token'); 
        navigate('/dashboard'); // Redirect to dashboard page
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    }, 1500);
  };

  return (
    // Container for the authentication form elements
    // Styling matches the auth.html preview with blur backdrop and rounded corners
    <div className="auth-container w-full max-w-md bg-[rgba(30,30,30,0.6)] backdrop-blur-md border border-border-color rounded-2xl p-8 sm:p-10 shadow-custom overflow-hidden relative">
      {/* Header section with application title and subtitle */}
      <div className="auth-header text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent mb-1.5">
          ChitChat AI
        </h1>
        <p className="text-text-secondary text-base">Connect with friends and Gemini.</p>
      </div>

      {/* Toggle buttons for switching between Login and Sign Up forms */}
      <div className="form-toggle flex bg-surface-1 rounded-lg p-1 mb-8 relative">
        {/* Slider element for visual indication of active toggle */}
        <div
          className={`toggle-slider absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-primary rounded-md transition-transform duration-300 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
            isLogin ? 'transform-none' : 'translate-x-[calc(100%+8px)]'
          }`}
        ></div>
        <button
          onClick={() => setIsLogin(true)}
          className={`toggle-btn flex-1 p-2.5 border-none bg-transparent font-semibold cursor-pointer transition-colors duration-300 z-10 ${isLogin ? 'text-text-primary' : 'text-text-secondary'}`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`toggle-btn flex-1 p-2.5 border-none bg-transparent font-semibold cursor-pointer transition-colors duration-300 z-10 ${!isLogin ? 'text-text-primary' : 'text-text-secondary'}`}
        >
          Sign Up
        </button>
      </div>

      {/* Form wrapper for horizontal sliding animation between forms */}
      <div className="form-wrapper w-[200%] flex transition-transform duration-400 ease-in-out" style={{ transform: isLogin ? 'translateX(0%)' : 'translateX(-50%)' }}>
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form w-1/2 flex flex-col gap-5 px-1">
          <div className="input-group relative">
            <i className="ph-at absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-xl"></i>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-border-color rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Email"
              required
            />
          </div>
          <div className="input-group relative">
            <i className="ph-lock-key absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-xl"></i>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-border-color rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="submit-btn p-3.5 border-none rounded-lg bg-primary text-text-primary text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-primary-light hover:-translate-y-0.5 active:translate-y-0" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="auth-form w-1/2 flex flex-col gap-5 px-1">
          <div className="input-group relative">
            <i className="ph-user absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-xl"></i>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-border-color rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Full Name"
              required
            />
          </div>
          <div className="input-group relative">
            <i className="ph-at absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-xl"></i>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-border-color rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Email"
              required
            />
          </div>
          <div className="input-group relative">
            <i className="ph-lock-key absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-xl"></i>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-border-color rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="submit-btn p-3.5 border-none rounded-lg bg-primary text-text-primary text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-primary-light hover:-translate-y-0.5 active:translate-y-0" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
      {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
    </div>
  );
}

export default AuthForm;

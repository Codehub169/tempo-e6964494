import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Corrected path
import LoadingSpinner from '../common/LoadingSpinner';

function AuthForm() {
  const [isLoginView, setIsLoginView] = useState(true); // Renamed for clarity
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, signup, loading: authLoading, error: authError, setError: setAuthError } = useAuth(); // Renamed loading and error for clarity
  const navigate = useNavigate();
  const [formLoading, setFormLoading] = useState(false); // Local loading state for form submission

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthError(null); // Clear previous global errors
    setFormLoading(true);

    try {
      if (isLoginView) {
        await login({ email, password });
        // Navigation to /dashboard is now handled by ProtectedRoute via AuthContext state update
      } else {
        await signup({ email, password, full_name: fullName });
        // AuthContext.signup shows an alert. User needs to manually switch to login.
        // To improve UX, we can switch to login view automatically after successful signup.
        // Check if signup call itself threw an error (authError would be set by useAuth hook if signup failed)
        // This requires signup in AuthContext to not throw an error that stops execution here if it's just a warning/info.
        // Assuming signup in AuthContext throws error on failure, and returns user on success.
        // If signup was successful (no error thrown and thus authError is null from this attempt):
        setIsLoginView(true); // Switch to login view
        // setEmail(''); // Clear fields for login, or prefill email if desired
        // setPassword(''); 
        // setFullName('');
        // Optionally, provide a success message for signup
        alert('Signup successful! Please log in with your new account.'); // Keep alert as per AuthContext
      }
      // Successful login will update AuthContext, and ProtectedRoute will handle navigation.
      // No explicit navigate('/dashboard') here is needed if ProtectedRoute is effective.

    } catch (err) {
      // Error is already set in AuthContext by login/signup methods if they throw.
      // This catch block is for any other unexpected errors during the handleSubmit process itself.
      console.error("AuthForm error caught in component's handleSubmit:", err); 
      // If AuthContext methods don't set authError for some reason, or if we want to add more specific form error:
      if (!authError) {
        setAuthError(err.message || 'An unexpected error occurred in the form.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const toggleFormType = () => {
    setIsLoginView(!isLoginView);
    setAuthError(null); // Clear global errors when switching forms
    setEmail('');
    setPassword('');
    setFullName('');
  }

  return (
    <div className="auth-container w-full max-w-md bg-[rgba(30,30,30,0.6)] backdrop-blur-md border border-border-color rounded-2xl p-8 sm:p-10 shadow-custom overflow-hidden relative">
      <div className="auth-header text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent mb-1.5">
          ChitChat AI
        </h1>
        <p className="text-text-secondary text-base">Connect with friends and Gemini.</p>
      </div>

      <div className="form-toggle flex bg-surface-1 rounded-lg p-1 mb-8 relative">
        <div
          className={`toggle-slider absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-primary rounded-md transition-transform duration-300 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
            isLoginView ? 'transform-none' : 'translate-x-[calc(100%+8px)]'
          }`}
        ></div>
        <button
          onClick={() => { if(!isLoginView) toggleFormType(); }}
          className={`toggle-btn flex-1 p-2.5 border-none bg-transparent font-semibold cursor-pointer transition-colors duration-300 z-10 ${isLoginView ? 'text-text-primary' : 'text-text-secondary'}`}
        >
          Login
        </button>
        <button
          onClick={() => { if(isLoginView) toggleFormType(); }}
          className={`toggle-btn flex-1 p-2.5 border-none bg-transparent font-semibold cursor-pointer transition-colors duration-300 z-10 ${!isLoginView ? 'text-text-primary' : 'text-text-secondary'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form flex flex-col gap-5 px-1">
        {!isLoginView && (
          <div className="input-group relative">
            <i className="ph-user absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary text-xl"></i>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-border-color rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              placeholder="Full Name"
              required={!isLoginView}
            />
          </div>
        )}
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
        <button type="submit" className="submit-btn p-3.5 border-none rounded-lg bg-primary text-text-primary text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-primary-light hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed" disabled={formLoading || authLoading}>
          {(formLoading || authLoading) ? <LoadingSpinner size='sm' color='white' /> : (isLoginView ? 'Login' : 'Create Account')}
        </button>
      </form>
      
      {authError && <p className="text-red-400 text-sm text-center mt-4">{authError}</p>}
    </div>
  );
}

export default AuthForm;

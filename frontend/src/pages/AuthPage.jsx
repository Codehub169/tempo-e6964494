import React from 'react';
import AuthForm from '../components/auth/AuthForm';

// AuthPage component: Renders the authentication form.
// This page provides the user interface for login and signup.
function AuthPage() {
  return (
    // Main container for the authentication page
    // Uses flexbox to center the AuthForm component on the screen
    // Background styling with radial gradients to match the HTML preview
    <div
      className="min-h-screen bg-background text-text-primary flex justify-center items-center p-4"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 50%, var(--primary), transparent 40%), radial-gradient(circle at 85% 30%, var(--primary-light), transparent 40%)',
      }}
    >
      {/* AuthForm component handles the actual login/signup logic and UI */}
      <AuthForm />
    </div>
  );
}

export default AuthPage;

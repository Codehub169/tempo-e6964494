import React from 'react';

function App() {
  // Basic structure, routing will be added later
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center">
      <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent">
        ChitChat AI
      </h1>
      <p className="mt-2 text-text-secondary">
        Connecting with friends and Gemini.
      </p>
      {/* RouterOutlet will go here in future implementations */}
    </div>
  );
}

export default App;
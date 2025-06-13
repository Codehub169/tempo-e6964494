import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ChatRoomPage from './pages/ChatRoomPage'; // This might be nested under Dashboard
import LoadingSpinner from './components/common/LoadingSpinner';

// ProtectedRoute component to handle routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Main App component with routing structure
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/chat/:chatId" 
            element={
              <ProtectedRoute>
                {/* ChatRoomPage might be better integrated within DashboardPage's layout */}
                {/* For now, direct route for simplicity in fixing the reported issue */}
                <ChatRoomPage /> 
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} /> {/* Default route */}        
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
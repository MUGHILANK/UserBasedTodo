import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAuth();

  console.log('🛡️ ProtectedRoute Check:', {
    isAuthenticated,
    loading,
    hasUser: !!user,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 10) + '...' : 'null'
  });

  // Show loading spinner while authentication is being checked
  if (loading) {
    console.log('🔄 ProtectedRoute: Still loading auth state');
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Only redirect to login if we're sure the user is not authenticated
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ ProtectedRoute: User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
